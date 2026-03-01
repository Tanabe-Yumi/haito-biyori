export const formatDate = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const date = dateObj.getDate();
  const hour = dateObj.getHours();
  const minute = dateObj.getMinutes();

  return `${year}/${month}/${date} ${hour}:${minute}`;
};
