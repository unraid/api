const useOpenFeedback = () => {
  const open = (includeUnraidApiLogs: boolean) => {
    console.debug('[useOpenFeedback.open]', { includeUnraidApiLogs });
    try {
      // eslint-disable-next-line no-undef
      // @ts-ignore – `FeedbackButton` will be included in 6.10.4+ DefaultPageLayout
      FeedbackButton();
    } catch (error) {
      console.error('[useOpenFeedback.open]', error);
    }
  }

  return {
    open,
  };
};

export default useOpenFeedback;
