#include "tgbridge.hpp"
#include "http.hpp"
#include <bsl/log.hpp>
#include <bsl/defer.hpp>
#include <hmac_sha256.h>
#include "openai.hpp"
#include <bsl/file.hpp>
#include "time.hpp"

DEFINE_LOG_CATEGORY(TelegramBridge)

TgBridge::TgBridge(const INIReader& config):
	m_Config(
		config
	),
	m_Hostname(
		config.Get(SectionName, "Hostname", "localhost")
	),
	m_Port(
		config.GetInteger(SectionName, "Port", 5535)
	),
	m_BotToken(
		config.Get("Bot", "Token", "")
	),
	m_Bot(
		m_BotToken
	)
{
	Super::Get("/api/tg/user/:id/:item", this, &ThisClass::GetTg);
	Super::Get("/api/placeholder/:text", this, &ThisClass::GetPlaceholder);
}

void TgBridge::Run(){
	Super::listen(m_Hostname, m_Port);
}

void TgBridge::GetTg(const httplib::Request& req, httplib::Response& resp) {
	std::int64_t id = GetIdParam(req, "id").value_or(0);
	std::string item = GetParam(req, "item").value_or("");

	if (!id || !item.size()) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	auto today = DateUtils::Now();
	
	const auto &chat = GetOrFetchChatInfo(id);

	if (chat.IsUnknown) {
		resp.status = httplib::StatusCode::NotFound_404;
		return;
	}

	if (item == "full") {
		
		nlohmann::json json = { 
			{"Username", chat.Username},
			{"FullName", chat.FirstName + ' ' + chat.LastName},
		};
		
		resp.status = httplib::StatusCode::OK_200;
		resp.set_content(json.dump(), "application/json");
		return;
	}

    if (item == "photo") {
        try {
            if (!chat.PhotoFileId.size()) {
				auto placeholder = GetOrDownloadPlaceholder(chat.FirstName, chat.LastName);
			
				if (placeholder.size()) {
					resp.status = httplib::StatusCode::OK_200;
					resp.set_content(placeholder, "image/png");
				}else{
					resp.status = httplib::StatusCode::NotFound_404;
					resp.set_content("Failed to fetch avatar", "text/plain");
				}

                return;
            }

			const auto &content = GetOrDownloadTgFile(chat.PhotoFileId);

            if (content.size()) {
                resp.status = httplib::StatusCode::OK_200;
                resp.set_content(content, "image/jpeg");
            } else {
				resp.status = httplib::StatusCode::NotFound_404;
				resp.set_content("Failed to fetch telegram avatar", "text/plain");
            }
        } catch (const std::exception& e) {
			LogTelegramBridge(Error, "Crashed on photo fetch: %", e.what());
            resp.status = httplib::StatusCode::InternalServerError_500;
            resp.set_content(e.what(), "text/plain");
        }

        return;
    }

	LogTelegramBridge(Error, "Bad request: item %, id %", item, id);
	resp.status = httplib::StatusCode::BadRequest_400;
}

void TgBridge::GetPlaceholder(const httplib::Request& req, httplib::Response& resp){
	std::string text = GetParam(req, "text").value_or("");

	if (!text.size()) {
		resp.status = httplib::StatusCode::BadRequest_400;
		return;
	}

	auto placeholder = GetOrDownloadPlaceholder(text, "");

	if (placeholder.size()) {
		resp.status = httplib::StatusCode::OK_200;
		resp.set_content(placeholder, "image/png");
	}else{
		resp.status = httplib::StatusCode::NotFound_404;
		resp.set_content("Failed to fetch avatar", "text/plain");
	}
}

const std::string& TgBridge::GetOrDownloadTgFile(const std::string& id) {
	if(m_TelegramCache.count(id))
		return m_TelegramCache[id];

    TgBot::File::Ptr file = m_Bot.getApi().getFile(id);

    std::string fileUrl = "https://api.telegram.org/file/bot" + m_Bot.getToken() + "/" + file->filePath;
    httplib::Client cli = MakeSecureClient("https://api.telegram.org");
    auto res = cli.Get(fileUrl.c_str());

    if (res && res->status == 200) 
		return (m_TelegramCache[id] = res->body);
	
	LogTelegramBridge(Error, "Photo fetch request failed with: %", res ? res->body : httplib::to_string(res.error()));
	
	static std::string Empty = "";
	return Empty;
}

const std::string& TgBridge::GetOrDownloadPlaceholder(const std::string& first, const std::string &last){
	const std::string key = first + "+" + last;

	if(m_PlaceholdersCache.count(key))
		return m_PlaceholdersCache[key];


	auto fallback = HttpGet("https://avatar.iran.liara.run", Format("/username?username=%", key));


	if (fallback.has_value())
		return (m_PlaceholdersCache[key] = std::move(fallback.value()));
	
	static std::string Empty = "";
	return Empty;
}

const TgBridge::CachedChatInfo& TgBridge::GetOrFetchChatInfo(std::int64_t user){
	auto now = std::chrono::steady_clock::now();

	static const std::string Empty;

	if (!m_ChatInfoCache.count(user)
	|| std::chrono::duration_cast<std::chrono::minutes>(now - m_ChatInfoCache[user].LastUpdate).count() > CachedChatInfo::UpdateIntervalMinutes) {
		
		CachedChatInfo info;
		info.LastUpdate = now;
		try{
			auto chat = m_Bot.getApi().getChat(user);
			info.FirstName = chat->firstName;
			info.LastName = chat->lastName;
			info.Username = chat->username;
			info.IsUnknown = false;
			info.PhotoFileId = chat->photo ? chat->photo->smallFileId : Empty;
		} catch (const std::exception& e) {
			info.FirstName = "<Unknown User>";
			info.LastName = Empty;
			info.Username = "<unknown>";
			info.IsUnknown = true;
			info.PhotoFileId = Empty;
		}

		m_ChatInfoCache[user] = info;
	}
	
	return m_ChatInfoCache[user];
}
