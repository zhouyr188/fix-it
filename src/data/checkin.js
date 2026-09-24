import AsyncStorage from '@react-native-async-storage/async-storage';

const CHECKIN_KEY = 'fixit_checkins';

export async function getCheckins(){
    const raw = await AsyncStorage.getItem(CHECKIN_KEY);
    return raw ? JSON.parse(raw) : [];
}


function formatDay(date){
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return y + '-' + m + '-' + d;
}

export async function countToday() {
    const raw = await AsyncStorage.getItem('fixit_dailycount');
    const counts = raw ? JSON.parse(raw) : [];
    const today = formatDay(new Date());
    const found = counts.filter((x) => x.date === today);
    return found.length > 0 ? found[0].count : 0;
}

export async function recordPractice(){
    const today = formatDay(new Date());
    const days = await getCheckins();
    if(days.includes(today)) return '已亮灯💡';

    const raw = await AsyncStorage.getItem('fixit_dailycount');
    let counts = raw ? JSON.parse(raw) : [];
    const found = counts.find((x) => x.date === today);
    const n = found ? found.count + 1 : 1;

    if (found) found.count = n; else counts.push({ date: today, count: n });
    await AsyncStorage.setItem('fixit_dailycount', JSON.stringify(counts));

    if (n >= 3) {
        days.push(today);
        await AsyncStorage.setItem(CHECKIN_KEY, JSON.stringify(days));
        return '亮灯！连续 ' + countStreak(days) + ' 天';
    }
    return '今日 ' + n + '/3';
}


export function countStreak(days){
    let streak = 0;
    const d = new Date();

    if(!days.includes(formatDay(d))){
        d.setDate(d.getDate() - 1);
    }
    while(days.includes(formatDay(d))){
        streak = streak + 1;
        d.setDate(d.getDate() - 1);
    }
    return streak;
}