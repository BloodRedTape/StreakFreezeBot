
const GetMillisecondsUntilNextHour = () => {
    const now = new Date();
    const nextHour = new Date();
    nextHour.setHours(now.getHours() + 1, 0, 0, 0); // Set to the top of the next hour
    return nextHour.getTime() - now.getTime();
}

export const OnEveryHour = (callback: ()=>void)=>{
    const millisecondsUntilNextHour = GetMillisecondsUntilNextHour();

    setTimeout(() => {
        callback();

        setInterval(callback, 60 * 60 * 1000);
    }, millisecondsUntilNextHour);
}
