# Route METAR Monitor - fixed build

## Deploy on Netlify
1. Upload this folder to Netlify.
2. Add environment variables:
   - CHECKWX_API_KEY
   - GEMINI_API_KEY
3. Open the site URL and load a route.

## Deploy on AWS Amplify
1. Create a new Amplify app and upload this folder.
2. Add the same environment variables:
   - CHECKWX_API_KEY
   - GEMINI_API_KEY
3. Deploy.

## Notes
- This build keeps the original UI and route-corridor logic.
- The Gemini backend now tries multiple current model endpoints automatically.
- Segment analysis prompts were upgraded to be more conservative and aviation-focused.


Fix in v2: repaired a JavaScript syntax error that could make the app stay blank after clicking Load route.


Fix in v3: switched prog chart image sources from the old Aviation Weather Center static GIF URLs to current NOAA/WPC chart image URLs.


v4 updates:
- Adds route-focused advisory overlays for G-AIRMET, SIGMET, and Convective SIGMET.
- Adds checkbox toggles on the map for those layers.
- Limits prog chart analysis to surface analysis and 12-hour prog and focuses the AI on route-relevant weather within roughly 6 hours.
- Fixes cut-off route analysis by allowing longer outputs and removing mid-sentence truncation in the overall decision box.


Fix in v5:
- Segment AI now explicitly uses route-relevant G-AIRMETs, SIGMETs, and Convective SIGMETs in the prompt.
- Added advisory overlays to the map with on/off checkboxes.
- Prog-chart analysis is now limited to surface analysis + 12-hour chart and is route-focused instead of broad CONUS-focused.
- Increased AI output budget to reduce incomplete sentences.


Fix in v6:
- Prog chart analysis gets a larger output budget to reduce cut-off text.
- G-AIRMET / SIGMET route filtering is more inclusive so more active advisories appear on the map.
- Removed any extra toggle wording after G-AIRMET.
- Advisory popups now show valid time, severity, base, top, and raw text when available from the source feed.


Fix in v7:
- Weather map now shows all current G-AIRMETs, SIGMETs, and Convective SIGMETs, not just route-relevant ones.
- AI still only uses route-relevant advisories for decision-making.
- Advisory overlays now use clearer separate colors and include a legend.
- Clicking overlapping advisories now opens one popup containing all advisories at that click point.
- Popup details are expanded for ID, hazard, severity, valid times, base, top, and raw text when the source feed provides them.
- Raised Gemini output budgets and removed most app-side truncation. This greatly reduces cutoff text, though model/API output can never be truly unlimited.


Fix in v8:
- Repaired a JavaScript syntax error in the advisory summary function that could prevent Load route from doing anything.


Fix in v9:
- Added planned cruise altitude input and made AI advisory weighting altitude-aware.
- Added a simple operational risk matrix to support the overall decision.
- Added CWA fetching, map layer, and advisory popup handling.
- Added G-AIRMET subtype styling (Sierra / Tango / Zulu), plus clearer legend colors.
- Added WPC surface analysis overlay toggle(s) for fronts and pressure systems. The WPC surface analysis image combines fronts, pressure centers, and MSLP on one layer.
- The map now still shows all current advisories, while AI remains route-focused.
- Raised Gemini output budgets again. Output still cannot be truly unlimited because the model and API impose limits.


Fix in v10:
- Removed the per-segment on-route AI analysis and replaced it with one overall general-aviation go/no-go briefing at the top.
- Added a follow-up AI discussion box under the overall briefing.
- Added runway-based wind assessment using open runway data so crosswind is treated differently from headwind/tailwind.
- Added altitude-aware advisory weighting to the overall AI and risk matrix.
- Kept the official WPC surface-analysis overlay for fronts and pressure systems. I did NOT convert those into vector artifacts because I could not verify a documented public AWC/WPC vector feed for those features.


Fix in v10b:
- Removed the fronts / pressure systems viewing option from the weather map and disabled the surface-analysis overlay.


Fix in v11:
- Added an optional official briefing PDF upload next to the route input.
- Uploaded PDF text is extracted server-side and included in the AI briefing context.
- Added a compact runway wind-components box to each airport METAR card, showing crosswind and headwind/tailwind components by runway.
- Added package.json with the PDF parsing dependencies used by the serverless function.


Fix in v12:
- Added a VFR / IFR selector next to the altitude input.
- The risk matrix and AI briefing now account for planned VFR vs IFR operations.
- Repaired the load-route flow so the app loads again even when the optional PDF feature is present.


Fix in v13:
- Repaired leftover broken HTML/JavaScript from the removed AI chat feature.
- This specifically fixes the page script so Load route works again.
- Kept the VFR / IFR selector and the other recent logic changes.


Fix in v14:
- Fixed an infinite recursion bug in renderRiskMatrix that caused the prog-chart analysis to fail with "Maximum call stack size exceeded".
- Removed leftover per-segment "Waiting for Gemini..." placeholders that were no longer wired to active analysis.
- Load route should now render the route cards and prog-chart analysis normally again.


Fix in v15:
- Added TAF fetching for departure, arrival, and selected off-route airports.
- TAFs are displayed on a separate Background page, not on the main briefing page.
- Removed the unused in-route analysis box.
- The overall go/no-go briefing now explicitly incorporates all gathered weather inputs, including METARs, advisories, runway wind logic, TAFs, uploaded briefing text, and prog-chart analysis.


Fix in v16:
- Replaced the brief rules-based overall decision with a long-form AI decision essay.
- The long-form go/no-go now explicitly considers METARs, TAFs, advisories, runway wind logic, uploaded briefing text, and prog-chart analysis together.
- Added raw prog-chart AI output to the Background page.


Fix in v17:
- Made the overall AI decision non-blocking so Load route can finish rendering even if Gemini is slow or fails.
- Added a visible AI spinner while the long-form briefing is being generated.
- Added a Retry AI button for the Gemini-based overall decision.
- Kept timeout fallback disabled, as requested.


Fix in v18:
- Repaired JavaScript syntax errors that were preventing Load route from running at all.
- Fixed malformed newline/string patches in the overall AI logic.
- Removed a duplicate geometryNearRoute() declaration that broke the page script.
- Kept the non-blocking AI, spinner, and Retry AI button from v17.
