
export const DebugLog = (data: string) => {
    fetch(window.location.origin + '/api/debug/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8', // Assuming you're using plain text; adjust as needed for your API
        },
        body: data,
    });
}