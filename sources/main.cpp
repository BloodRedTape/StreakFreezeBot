#include <bsl/log.hpp>
#include <bsl/file.hpp>
#include <httplib.h>
#include <INIReader.h>

int main(int argc, char *argv[]) {

	std::string config_name = (argc == 2 ? argv[1] : "Config.ini");

	INIReader config(ReadEntireFile(config_name));

	if(config.ParseError()){
		Println("Can't parse config file: %", config_name);
		return EXIT_FAILURE;
	}
	

	return 0;
}