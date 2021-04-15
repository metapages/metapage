export const delay = async (milliseconds : number = 1000) => {
  return new Promise(r => setTimeout(r, milliseconds));
};
