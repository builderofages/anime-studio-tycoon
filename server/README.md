# IAP receipt validator
Deploy `validate.js` to any HTTPS host (Vercel/Netlify/Cloud Run), set the env vars listed
at the top of the file, then put the deployed URL into `VALIDATOR_URL` in ../iap.js.
This makes purchases server-verified — closing the two CRITICAL bugs GLM-5.2 found.
