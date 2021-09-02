export const attemptJSONParse = (text: string, fallback: any) => {
	try {
		return JSON.parse(text);
	} catch {
		return fallback;
	}
};
