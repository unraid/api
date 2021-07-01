export const attemptJSONParse = (text: string, fallback: any = undefined) => {
	try {
		return JSON.parse(text);
	} catch {
		return fallback;
	}
};
