// Purpose: force vite to include these dependencies in the build output.
// They don't show up when required, so the build will fail in CI. 
// When imported as ESM, some combination of our dependencies causes the imports to err out at runtime 
// and break tailwind config resolution.
//
// By adding these imports as side effects to the vite build, we can brute-force the desired behavior.
// Once we have a better understanding of the root cause, and our dependencies have stabilized, we should remove this hack.
import "@tailwindcss/typography";
import "tailwindcss-animate";