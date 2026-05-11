import posthog from 'posthog-js'

posthog.init('phc_zF3u6Ddnu5xzV5RPLk8BBZPUSrdmAgJR6DZu8vF9T3Ef', {
    api_host: 'https://us.i.posthog.com',
    autocapture: false,
    capture_pageview: false, // we handle pageviews manually via PostHogPageTracker
    session_recording: false,
})

export default posthog