import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = (scope, userId) => `read-alert:${scope}:${userId || 'guest'}`;

export const getLastReadAt = async (scope, userId) => {
  const value = await AsyncStorage.getItem(keyFor(scope, userId));
  return value ? Number(value) || 0 : 0;
};

export const markReadNow = async (scope, userId) => {
  await AsyncStorage.setItem(keyFor(scope, userId), String(Date.now()));
};

export const countUnreadSince = (items = [], lastReadAt = 0) => {
  return items.filter((item) => {
    const createdAt = item?.created_at || item?.createdAt || item?.inserted_at;
    if (!createdAt) return lastReadAt === 0;

    const createdTime = new Date(createdAt).getTime();
    if (!createdTime) return lastReadAt === 0;

    return createdTime > lastReadAt;
  }).length;
};

export const getExamMarkAlertItems = (exams = []) => {
  return exams.flatMap((exam) => {
    return (exam?.subjects || []).map((mark) => ({
      ...mark,
      created_at: mark?.created_at || mark?.updated_at || mark?.date || exam?.date,
    }));
  });
};
