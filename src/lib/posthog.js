import posthog from 'posthog-js'

posthog.init('phc_zF3u6Ddnu5xzV5RPLk8BBZPUSrdmAgJR6DZu8vF9T3Ef', {
    api_host: 'https://us.i.posthog.com',
    autocapture: false,
    capture_pageview: false, // we handle pageviews manually via PostHogPageTracker
    session_recording: {
        maskAllInputs: true,       // hides typed text in replays (privacy)
        maskInputOptions: {
            password: true,        // double-ensure passwords are masked
        },
    },
})

export default posthog