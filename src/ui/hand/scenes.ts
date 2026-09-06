/**
 * What is at each spot up close, and how it answers the hand.
 *
 * The town is drawn once at 1440 by 820 and these scenes are drawn straight
 * into that box, in the same units, on an overlay above it. At the wide view
 * they are invisible; as the camera comes in they fade up over the dot that
 * stood there, with figures the same twenty units tall as the dot and more
 * in them. Nothing here is React: the scenes are built once into an svg group
 * and moved by hand, because a hand moving things is the whole point.
 */

const NS = 'http://www.w3.org/2000/svg';

/* ---------- symbols: near figures, props and tools ---------- */
export const DEFS = `
<g id="mgStand"><ellipse cy="10.6" rx="5.6" ry="2.2" fill="#3d4a34" opacity=".32"/><g stroke="#3f342a" stroke-width="1.8" stroke-linecap="round"><line x1="-1.7" y1="7.4" x2="-2.1" y2="10.2"/><line x1="1.7" y1="7.4" x2="2.1" y2="10.2"/></g><path d="M-3.4 -1.6 h6.8 a1.6 1.6 0 0 1 1.6 1.6 v6.6 a1.8 1.8 0 0 1 -1.8 1.8 h-6.4 a1.8 1.8 0 0 1 -1.8 -1.8 v-6.6 a1.6 1.6 0 0 1 1.6 -1.6 z" fill="currentColor"/><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><line x1="-4" y1="0" x2="-5.2" y2="5.4"/><line x1="4" y1="0" x2="5.2" y2="5.4"/></g><g fill="#f0e3c6"><circle cx="-5.3" cy="6.1" r="1.15"/><circle cx="5.3" cy="6.1" r="1.15"/></g><rect x="-1.2" y="-3.4" width="2.4" height="2.2" fill="#e6d7b8"/><circle cy="-6.3" r="3.6" fill="#f0e3c6"/><path d="M-3.5 -7.3 q3.5 -4.2 7 0" stroke="#6b5a44" stroke-width="1.9" fill="none" stroke-linecap="round"/></g>
<g id="mgWatch"><ellipse cy="10.6" rx="5.6" ry="2.2" fill="#3d4a34" opacity=".32"/><g stroke="#3f342a" stroke-width="1.8" stroke-linecap="round"><line x1="-1.7" y1="7.4" x2="-2.1" y2="10.2"/><line x1="1.7" y1="7.4" x2="2.1" y2="10.2"/></g><path d="M-3.4 -1.6 h6.8 a1.6 1.6 0 0 1 1.6 1.6 v6.6 a1.8 1.8 0 0 1 -1.8 1.8 h-6.4 a1.8 1.8 0 0 1 -1.8 -1.8 v-6.6 a1.6 1.6 0 0 1 1.6 -1.6 z" fill="currentColor"/><path d="M-4 0 q-1.5 4 2 4.6 M4 0 q1.5 4 -2 4.6" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/><rect x="-1.2" y="-3.4" width="2.4" height="2.2" fill="#e6d7b8"/><circle cy="-6.3" r="3.6" fill="#f0e3c6"/><path d="M-3.5 -7.3 q3.5 -4.2 7 0" stroke="#6b5a44" stroke-width="1.9" fill="none" stroke-linecap="round"/><g fill="#3f342a"><circle cx="-1.2" cy="-6.2" r=".45"/><circle cx="1.2" cy="-6.2" r=".45"/></g></g>
<g id="mgDig"><ellipse cx="3" cy="10.6" rx="7" ry="2.2" fill="#3d4a34" opacity=".32"/><g stroke="#3f342a" stroke-width="1.8" stroke-linecap="round"><line x1="-1.6" y1="6.8" x2="-2.6" y2="10.2"/><line x1="1.6" y1="6.8" x2="2.2" y2="10.2"/></g><path d="M-3 7.2 q-1 -5 2.4 -8.4 q4 -3.6 8 -1.6 l1.2 3.2 q-3.6 -.4 -6.4 2.8 q-2.2 2.4 -2.2 4.4 z" fill="currentColor"/><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><line x1="6" y1="-.6" x2="9.4" y2="4.6"/><line x1="7.6" y1="-1.8" x2="11" y2="3"/></g><circle cx="9.6" cy="-3.6" r="3.4" fill="#f0e3c6"/><path d="M6.6 -4.6 q3 -4 6.6 -1.4" stroke="#6b5a44" stroke-width="1.8" fill="none" stroke-linecap="round"/><line x1="9.4" y1="4.6" x2="13.4" y2="11" stroke="#8a7059" stroke-width="1.1" stroke-linecap="round"/><path d="M12.2 10.2 l3.2 -1 l1.2 3 l-3.2 1.2 z" fill="#8d8a80" stroke="#4d4a40" stroke-width=".35"/></g>
<g id="mgSitBack"><ellipse cy="9.2" rx="7.5" ry="2.4" fill="#3d4a34" opacity=".32"/><path d="M-1 4.6 h8.6 a1.4 1.4 0 0 1 0 2.8 h-8.6 z" fill="#3f342a"/><path d="M-3.6 -1.2 h6 a1.6 1.6 0 0 1 1.6 1.6 v5.4 a1.8 1.8 0 0 1 -1.8 1.8 h-5.6 a1.8 1.8 0 0 1 -1.8 -1.8 v-5.4 a1.6 1.6 0 0 1 1.6 -1.6 z" fill="currentColor"/><path d="M-3.6 .4 q-3.4 2 -2.4 5.4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/><circle cx="-5.8" cy="6.2" r="1.15" fill="#f0e3c6"/><line x1="3.6" y1="1" x2="6.6" y2="4.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="7" cy="5.2" r="1.15" fill="#f0e3c6"/><rect x="-1.2" y="-3" width="2.4" height="2.2" fill="#e6d7b8"/><circle cy="-5.9" r="3.6" fill="#f0e3c6"/><path d="M-3.5 -6.9 q3.5 -4.2 7 0" stroke="#6b5a44" stroke-width="1.9" fill="none" stroke-linecap="round"/></g>
<g id="mgSitMend"><ellipse cy="9.2" rx="7.5" ry="2.4" fill="#3d4a34" opacity=".32"/><path d="M-1 4.6 h8.6 a1.4 1.4 0 0 1 0 2.8 h-8.6 z" fill="#3f342a"/><path d="M-3.6 -1.2 h6 a1.6 1.6 0 0 1 1.6 1.6 v5.4 a1.8 1.8 0 0 1 -1.8 1.8 h-5.6 a1.8 1.8 0 0 1 -1.8 -1.8 v-5.4 a1.6 1.6 0 0 1 1.6 -1.6 z" fill="currentColor"/><line x1="3.6" y1=".4" x2="7.8" y2="-2.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="8.2" cy="-2.8" r="1.15" fill="#f0e3c6"/><g transform="translate(8.6 -3.2) rotate(-30)"><rect x="-.5" y="0" width="1" height="6" fill="#8a7059"/><rect x="-2" y="-1.6" width="4" height="2" rx=".4" fill="#4d4a40"/></g><line x1="-3.6" y1="1" x2="-1.6" y2="5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><rect x="-1.2" y="-3" width="2.4" height="2.2" fill="#e6d7b8"/><circle cy="-5.9" r="3.6" fill="#f0e3c6"/><path d="M-3.5 -6.9 q3.5 -4.2 7 0" stroke="#6b5a44" stroke-width="1.9" fill="none" stroke-linecap="round"/></g>
<g id="mgStool"><ellipse cy="9.6" rx="7" ry="2.4" fill="#3d4a34" opacity=".32"/><g fill="#8a7059"><rect x="-4.6" y="4.2" width="9" height="1.6" rx=".6"/><rect x="-4" y="5.6" width="1.2" height="4"/><rect x="2.8" y="5.6" width="1.2" height="4"/></g><path d="M-3.6 -2.6 h6 a1.6 1.6 0 0 1 1.6 1.6 v5 a1.6 1.6 0 0 1 -1.6 1.6 h-6 a1.6 1.6 0 0 1 -1.6 -1.6 v-5 a1.6 1.6 0 0 1 1.6 -1.6 z" fill="currentColor"/><g stroke="#3f342a" stroke-width="1.8" stroke-linecap="round"><line x1="-2" y1="5.2" x2="-4.4" y2="9.4"/><line x1="2" y1="5.2" x2="4.6" y2="9.4"/></g><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><line x1="-4" y1="-1" x2="-2.6" y2="3.6"/><line x1="4" y1="-1" x2="2.6" y2="3.6"/></g><g fill="#f0e3c6"><circle cx="-2.4" cy="4.2" r="1.1"/><circle cx="2.4" cy="4.2" r="1.1"/></g><line x1="-3" y1="4.4" x2="3.2" y2="3.4" stroke="#8a7059" stroke-width="1.1" stroke-linecap="round"/><rect x="-1.2" y="-4.4" width="2.4" height="2.2" fill="#e6d7b8"/><circle cy="-7.3" r="3.6" fill="#f0e3c6"/><path d="M-3.5 -8.3 q3.5 -4.2 7 0" stroke="#6b5a44" stroke-width="1.9" fill="none" stroke-linecap="round"/></g>
<g id="mgChild"><ellipse cy="8.6" rx="4.6" ry="1.8" fill="#3d4a34" opacity=".32"/><g stroke="#3f342a" stroke-width="1.5" stroke-linecap="round"><line x1="-1.4" y1="6" x2="-1.7" y2="8.4"/><line x1="1.4" y1="6" x2="1.7" y2="8.4"/></g><path d="M-2.8 -1.2 h5.6 a1.2 1.2 0 0 1 1.2 1.2 v3 l1.2 3.4 h-9.6 l1.2 -3.4 v-3 a1.2 1.2 0 0 1 1.2 -1.2 z" fill="currentColor"/><g stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><line x1="-3.2" y1="0" x2="-4.4" y2="4.4"/><line x1="3.2" y1="0" x2="4.4" y2="4.4"/></g><g fill="#f0e3c6"><circle cx="-4.5" cy="5" r="1"/><circle cx="4.5" cy="5" r="1"/></g><rect x="-1" y="-2.8" width="2" height="1.8" fill="#e6d7b8"/><circle cy="-5.4" r="3.2" fill="#f0e3c6"/><path d="M-3.2 -6.2 q3.2 -4 6.4 0" stroke="#6b5a44" stroke-width="1.8" fill="none" stroke-linecap="round"/><g stroke="#6b5a44" stroke-width="1.1" stroke-linecap="round"><line x1="-3.2" y1="-5.4" x2="-3.6" y2="-1.4"/><line x1="3.2" y1="-5.4" x2="3.6" y2="-1.4"/></g></g>
<g id="mgChildBehind"><ellipse cy="8.6" rx="4.6" ry="1.8" fill="#3d4a34" opacity=".32"/><g stroke="#3f342a" stroke-width="1.5" stroke-linecap="round"><line x1="-1.4" y1="6" x2="-1.7" y2="8.4"/><line x1="1.4" y1="6" x2="1.7" y2="8.4"/></g><path d="M-2.8 -1.2 h5.6 a1.2 1.2 0 0 1 1.2 1.2 v3 l1.2 3.4 h-9.6 l1.2 -3.4 v-3 a1.2 1.2 0 0 1 1.2 -1.2 z" fill="currentColor"/><path d="M-3.2 0 q-2 3 -1 4.4 M3.2 0 q2 3 1 4.4" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/><rect x="-1" y="-2.8" width="2" height="1.8" fill="#e6d7b8"/><circle cy="-5.4" r="3.2" fill="#f0e3c6"/><path d="M-3.2 -6.2 q3.2 -4 6.4 0" stroke="#6b5a44" stroke-width="1.8" fill="none" stroke-linecap="round"/><g stroke="#6b5a44" stroke-width="1.1" stroke-linecap="round"><line x1="-3.2" y1="-5.4" x2="-3.6" y2="-1.4"/><line x1="3.2" y1="-5.4" x2="3.6" y2="-1.4"/></g><g fill="#3f342a"><circle cx="-1.1" cy="-5.4" r=".4"/><circle cx="1.1" cy="-5.4" r=".4"/></g></g>
<g id="mgLie"><ellipse cx="1" cy="3.4" rx="12" ry="2.6" fill="#3d4a34" opacity=".32"/><g stroke="#3f342a" stroke-width="1.8" stroke-linecap="round"><line x1="7" y1="0" x2="11.4" y2="1"/><line x1="7" y1="2" x2="11.6" y2="3.2"/></g><path d="M-5 -3 h12 a1.8 1.8 0 0 1 1.8 1.8 v3.4 a1.8 1.8 0 0 1 -1.8 1.8 h-12 a1.8 1.8 0 0 1 -1.8 -1.8 v-3.4 a1.8 1.8 0 0 1 1.8 -1.8 z" fill="currentColor"/><line x1="-2" y1="3.2" x2="2" y2="6.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="2.4" cy="6.8" r="1.1" fill="#e6d7b8"/><circle cx="-9.4" cy="0" r="3.4" fill="#e6d7b8"/><path d="M-12.6 -1.2 q1.6 -4 5.6 -2.2" stroke="#6b5a44" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>
<g id="mgHorse"><ellipse cx="0" cy="9.6" rx="10" ry="2.6" fill="#3d4a34" opacity=".32"/><g stroke="#5a4636" stroke-width="1.6" stroke-linecap="round"><line x1="-6" y1="2" x2="-6.6" y2="9"/><line x1="-3" y1="2" x2="-3.4" y2="9"/><line x1="4" y1="2" x2="4.4" y2="9"/><line x1="7" y1="2" x2="7.6" y2="9"/></g><ellipse cx="0" cy="0" rx="9" ry="4.2" fill="#7a5a42"/><path d="M7 -2 q4 -4 5 -8 q2 1 2.4 3 q-1 4 -4 7 z" fill="#7a5a42"/><path d="M11.6 -8.4 l2.8 -1.2 l.4 2.4 z" fill="#5a4636"/><path d="M-9 -1 q-3 2 -3.6 6" stroke="#5a4636" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M7.4 -3.4 q1.6 -2.4 4 -3.6" stroke="#3f342a" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>
<g id="mgSpade"><line x1="0" y1="-8" x2="0" y2="4" stroke="#8a7059" stroke-width="1.1" stroke-linecap="round"/><path d="M-1.8 3.4 h3.6 l.4 4.4 l-2.2 1.2 l-2.2 -1.2 z" fill="#8d8a80" stroke="#4d4a40" stroke-width=".35"/><rect x="-1.6" y="-9" width="3.2" height="1.2" rx=".5" fill="#8a7059"/></g>
<g id="mgLoaf"><ellipse cx=".3" cy="1.2" rx="3.9" ry="1.3" fill="#3d4a34" opacity=".25"/><ellipse rx="3.7" ry="2.1" fill="#c99a5b" stroke="#8a6238" stroke-width=".4"/><path d="M-2 -.9 l1 1 M-.4 -1.2 l1 1 M1.3 -.9 l1 1" stroke="#8a6238" stroke-width=".35" stroke-linecap="round"/></g>
<g id="mgHalf"><path d="M0 -2.1 a3.7 2.1 0 0 1 0 4.2 z" fill="#c99a5b" stroke="#8a6238" stroke-width=".4"/><path d="M0 -2.1 v4.2" stroke="#e9d8b0" stroke-width=".7"/></g>
<g id="mgCoin"><circle r="1.25" fill="#c8a24a" stroke="#8a6a2a" stroke-width=".35"/><circle r=".55" fill="none" stroke="#8a6a2a" stroke-width=".25"/></g>
<g id="mgPie"><circle r="1.8" fill="#d9a862" stroke="#8a6238" stroke-width=".4" stroke-dasharray=".5 .4"/><circle r=".8" fill="#b06a48" opacity=".8"/></g>
<g id="mgBasket"><ellipse cy="4.4" rx="5" ry="1.4" fill="#3d4a34" opacity=".25"/><path d="M-4.6 -1 h9.2 l-1.2 5.2 h-6.8 z" fill="#b08a55" stroke="#7b5a34" stroke-width=".4"/><path d="M-3.4 -1 a3.4 3.2 0 0 1 6.8 0" fill="none" stroke="#7b5a34" stroke-width=".7"/><use href="#mgPie" x="-2" y="-1.4"/><use href="#mgPie" x="1.4" y="-1.8"/><use href="#mgPie" x="-.2" y="-.2"/><g stroke="#7b5a34" stroke-width=".3"><line x1="-3.8" y1="1.2" x2="3.8" y2="1.2"/><line x1="-3.4" y1="2.8" x2="3.4" y2="2.8"/></g></g>
<g id="mgSlate"><rect x="-5.2" y="-3.8" width="10.4" height="7.6" rx=".6" fill="#8a7059"/><rect x="-4.5" y="-3.1" width="9" height="6.2" rx=".4" fill="#3a3128"/><text x="0" y="1.1" font-family="ui-serif, Georgia, serif" font-size="2.3" fill="#e9dcbe" text-anchor="middle" letter-spacing=".25">NOTHING</text></g>
<g id="mgBoard"><rect x="-2.3" y="-1.5" width="4.6" height="3" rx=".3" fill="#c3ac83" stroke="#7b6449" stroke-width=".3"/><circle cx="0" cy="-.9" r=".3" fill="#4d4a40"/><g stroke="#7b6449" stroke-width=".25"><line x1="-1.4" y1=".1" x2="1.4" y2=".1"/><line x1="-1.4" y1=".8" x2="1" y2=".8"/></g></g>
<g id="mgReceipt"><rect x="-1.3" y="-1.7" width="2.6" height="3.4" fill="#f0e6cc" stroke="#8a7059" stroke-width=".2"/><g stroke="#8a7059" stroke-width=".2"><line x1="-.8" y1="-.8" x2=".8" y2="-.8"/><line x1="-.8" y1="-.1" x2=".6" y2="-.1"/><line x1="-.8" y1=".6" x2=".8" y2=".6"/></g></g>
<g id="mgHandles"><g stroke="#8a7059" stroke-width="1" stroke-linecap="round"><line x1="-4" y1="1.6" x2="3" y2="-1.4"/><line x1="-3" y1="-1" x2="4" y2="1.4"/><line x1="-1" y1="2.2" x2="1.6" y2="-2.4"/></g><path d="M3 -1.4 l1 -.6 M4 1.4 l1.2 .4" stroke="#4d4a40" stroke-width=".7" stroke-linecap="round"/></g>
<g id="mgTag"><rect x="-1.9" y="-.8" width="3.8" height="1.6" rx=".2" fill="#f0e6cc" stroke="#8a7059" stroke-width=".2"/><path d="M-1.3 0 q.5 -.6 1 0 t1 0 t.6 0" stroke="#4d4a40" stroke-width=".3" fill="none"/></g>
<g id="mgCoat"><path d="M-4 -2.4 h8 l1 5 h-10 z" fill="#6f6a60" stroke="#4d4a40" stroke-width=".3"/><line x1="0" y1="-2.4" x2="0" y2="2.4" stroke="#4d4a40" stroke-width=".3"/></g>
<g id="mgLaw"><rect x="-2.4" y="-3" width="4.8" height="6" fill="#f0e6cc" stroke="#8a7059" stroke-width=".25"/><g stroke="#8a7059" stroke-width=".28"><line x1="-1.6" y1="-1.8" x2="1.6" y2="-1.8"/><line x1="-1.6" y1="-.9" x2="1.2" y2="-.9"/><line x1="-1.6" y1="0" x2="1.6" y2="0"/><line x1="-1.6" y1=".9" x2=".8" y2=".9"/></g><circle cx="1.2" cy="2" r=".7" fill="#a3352c"/></g>
<g id="mgStone"><ellipse cx=".4" cy="3.6" rx="3.6" ry="1.1" fill="#3d4a34" opacity=".3"/><path d="M-2.6 3.2 l.4 -5.6 q2.2 -2 4.4 0 l.6 5.6 z" fill="#a2988a" stroke="#6f6a60" stroke-width=".35"/><line x1="-.8" y1="-.6" x2=".9" y2="-.6" stroke="#6f6a60" stroke-width=".35"/><line x1="-.6" y1=".6" x2=".7" y2=".6" stroke="#6f6a60" stroke-width=".35"/></g>
<g id="mgCross"><line x1="0" y1="-5.5" x2="0" y2="2" stroke="#8a7059" stroke-width="1"/><line x1="-2" y1="-3.2" x2="2" y2="-3.2" stroke="#8a7059" stroke-width="1"/><ellipse cy="2.4" rx="3.2" ry="1.1" fill="#6b5744" opacity=".7"/></g>
<g id="mgPile"><ellipse cy="2.4" rx="5.4" ry="1.5" fill="#3d4a34" opacity=".3"/><path d="M-4.6 2 q-.4 -3 3 -3.4 q2 -2.4 4.6 -.4 q2 .6 1.6 3.8 z" fill="#6f6a60"/><path d="M-3 1.6 q1 -2.4 3.4 -1.8 q1.6 -1.2 3 .6" stroke="#8a7059" stroke-width=".5" fill="none"/><path d="M-2.4 .2 q-.2 -2 1.8 -2.2" stroke="#4d4a40" stroke-width=".4" fill="none"/></g>
<g id="mgDesk"><ellipse cx="0" cy="5" rx="9" ry="1.6" fill="#3d4a34" opacity=".3"/><g fill="#8a7059"><rect x="-6.6" y="-.2" width="1.3" height="5.2"/><rect x="5.3" y="-.2" width="1.3" height="5.2"/></g><rect x="-7.6" y="-2.4" width="15.2" height="2.6" rx=".5" fill="#b09773" stroke="#7b6449" stroke-width=".35"/><ellipse cx="-3.6" cy="-2.6" rx="1.8" ry=".7" fill="#4d4a40"/><use href="#mgCoin" x="-3.8" y="-2.9"/><use href="#mgCoin" x="-3" y="-3.2"/></g>
<g id="mgCart"><ellipse cx="0" cy="6.4" rx="9" ry="1.8" fill="#3d4a34" opacity=".3"/><rect x="-6" y="-3" width="12" height="7" rx=".6" fill="#8a7059" stroke="#5a4636" stroke-width=".4"/><g stroke="#5a4636" stroke-width=".3"><line x1="-6" y1="-.5" x2="6" y2="-.5"/><line x1="-6" y1="2" x2="6" y2="2"/></g><circle cx="-3.4" cy="5" r="2.2" fill="#5a4636" stroke="#3f342a" stroke-width=".4"/><circle cx="3.4" cy="5" r="2.2" fill="#5a4636" stroke="#3f342a" stroke-width=".4"/><line x1="6" y1="-1" x2="11" y2="-2" stroke="#5a4636" stroke-width=".9" stroke-linecap="round"/></g>
<g id="mgBanner"><line x1="0" y1="0" x2="0" y2="-14" stroke="#5a4636" stroke-width=".8"/><path d="M0 -14 h7 l-1.6 2.4 l1.6 2.4 h-7 z" fill="#3a3128"/></g>
<g id="mgStall"><ellipse cx="0" cy="6.8" rx="9" ry="1.8" fill="#3d4a34" opacity=".3"/><g stroke="#8a7059" stroke-width="1"><line x1="-7" y1="-6" x2="-7" y2="6"/><line x1="7" y1="-6" x2="7" y2="6"/></g><rect x="-7.6" y="1" width="15.2" height="2.4" rx=".5" fill="#b09773" stroke="#7b6449" stroke-width=".35"/><path d="M-8.6 -6 h17.2 l-1 -3 h-15.2 z" fill="#c96a5a"/><g fill="#f0e6cc"><rect x="-6.4" y="-9" width="2.2" height="3"/><rect x="-1.4" y="-9" width="2.2" height="3"/><rect x="3.6" y="-9" width="2.2" height="3"/></g><use href="#mgPie" x="-4" y="-.4"/><use href="#mgPie" x="0" y="-.6"/><use href="#mgPie" x="4" y="-.4"/></g>
<g id="mgShelter"><g stroke="#8a7059" stroke-width="1"><line x1="-6" y1="-7" x2="-6" y2="4"/><line x1="6" y1="-7" x2="6" y2="4"/></g><path d="M-8 -7 h16 l2 -3 h-20 z" fill="#9a7d5c" stroke="#7b6449" stroke-width=".35"/></g>
<g id="mgAsh"><ellipse rx="5.2" ry="2.2" fill="#4d4a40" opacity=".85"/><ellipse cx="-1" cy="-.4" rx="2.6" ry="1" fill="#3a3128"/><g stroke="#2a2420" stroke-width=".4"><line x1="-3" y1=".8" x2="-1" y2="-.2"/><line x1="1.4" y1="1" x2="3" y2=".2"/></g></g>
<g id="mgFlame"><path d="M0 0 q-3 -3.4 -1.6 -7.4 q.6 2 2 2.6 q-.2 -3.6 2.4 -6 q-.6 3.2 1.6 5.2 q1.6 2.4 -.6 5.2 q-2 2 -3.8 .4 z" fill="#e0763a" opacity=".92"/><path d="M0 -.6 q-1.4 -2.2 -.6 -4.6 q.8 1.6 1.8 1.6 q0 -2.2 1.4 -3.4 q-.2 2.2 1 3.6 q.8 1.8 -.6 3.2 q-1.6 1.2 -3 -.4 z" fill="#f3c25a"/></g>
<g id="mgPost"><ellipse cx="0" cy="12" rx="4" ry="1.4" fill="#3d4a34" opacity=".3"/><rect x="-1.6" y="-14" width="3.2" height="26" rx=".8" fill="#c3ac83" stroke="#7b6449" stroke-width=".4"/><rect x="-2.4" y="-15" width="4.8" height="1.6" rx=".6" fill="#a58a68"/><line x1="1.6" y1="-11" x2="5" y2="-11" stroke="#7b6449" stroke-width=".7"/><rect x="4" y="-10.6" width="2.4" height="3.2" rx=".4" fill="#f3c25a" opacity=".85" stroke="#7b6449" stroke-width=".3"/></g>
<g id="mgBucket"><ellipse cy="4.6" rx="4.4" ry="1.3" fill="#3d4a34" opacity=".25"/><path d="M-4 -2.4 h8 l-1 6.4 h-6 z" fill="#8d8a80" stroke="#4d4a40" stroke-width=".4"/><path d="M-3.4 -2.4 a3.4 3 0 0 1 6.8 0" fill="none" stroke="#5a4636" stroke-width=".6"/><ellipse cy="-2.2" rx="4" ry="1.2" fill="#5f90a2"/></g>
<g id="mgCup"><path d="M-1.7 -1.6 h3.4 l-.5 3.4 h-2.4 z" fill="#c3ac83" stroke="#7b6449" stroke-width=".3"/><ellipse cy="-1.6" rx="1.7" ry=".6" fill="#5f90a2"/></g>
<g id="mgCupEmpty"><path d="M-1.7 -1.6 h3.4 l-.5 3.4 h-2.4 z" fill="#c3ac83" stroke="#7b6449" stroke-width=".3"/></g>
<g id="mgCupCrown"><path d="M-1.9 -1.8 h3.8 l-.6 3.8 h-2.6 z" fill="#c3ac83" stroke="#7b6449" stroke-width=".3"/><rect x="-1.9" y="-.4" width="3.8" height=".8" fill="#a3352c"/><ellipse cy="-1.8" rx="1.9" ry=".7" fill="#5f90a2"/></g>
<g id="mgHat"><ellipse cy="2.6" rx="5" ry="1.6" fill="#3d4a34" opacity=".28"/><ellipse cy="1.4" rx="4.8" ry="1.8" fill="#7a6a52"/><path d="M-3 1.4 q0 -4.2 3 -4.2 q3 0 3 4.2 z" fill="#8a7059" stroke="#5a4636" stroke-width=".3"/><circle cx="-.6" cy="-.8" r=".7" fill="#4d4a40"/><circle cx="1" cy="-1.4" r=".6" fill="#4d4a40"/></g>
<g id="mgPebble"><ellipse rx="1" ry=".8" fill="#8d8a80" stroke="#5a5348" stroke-width=".2"/></g>
<g id="mgPlank"><rect x="-22" y="-1.4" width="44" height="2.8" rx=".6" fill="#b09773" stroke="#7b6449" stroke-width=".35"/><g><use href="#mgCupEmpty" x="-17" y="-1.8"/><use href="#mgCupEmpty" x="-8.5" y="-1.8"/><use href="#mgCupEmpty" x="0" y="-1.8"/><use href="#mgCupEmpty" x="8.5" y="-1.8"/><use href="#mgCupEmpty" x="17" y="-1.8"/></g></g>
<g id="mgPlankWet"><rect x="-22" y="-1.4" width="44" height="2.8" rx=".6" fill="#b09773" stroke="#7b6449" stroke-width=".35"/><g><use href="#mgCup" x="-17" y="-1.8"/><use href="#mgCup" x="-8.5" y="-1.8"/><use href="#mgCup" x="0" y="-1.8"/><use href="#mgCup" x="8.5" y="-1.8"/><use href="#mgCup" x="17" y="-1.8"/></g></g>
<g id="mgCoinUp"><circle r="1.25" fill="#c8a24a" stroke="#8a6a2a" stroke-width=".35"/></g>
<g id="mgHand"><path d="M-2.6 -3.2 h5.2 a1.6 1.6 0 0 1 1.6 1.6 v5.4 a3.2 3.2 0 0 1 -3.2 3.2 h-2 a3.2 3.2 0 0 1 -3.2 -3.2 v-5.4 a1.6 1.6 0 0 1 1.6 -1.6 z" fill="#f0e3c6" stroke="#6b5a44" stroke-width=".45"/><path d="M-4.2 .2 q-2.2 .6 -2 3 q.6 1.6 2.2 1.2" fill="#f0e3c6" stroke="#6b5a44" stroke-width=".45"/><g stroke="#6b5a44" stroke-width=".3"><line x1="-1" y1="-3.2" x2="-1" y2="0"/><line x1=".6" y1="-3.2" x2=".6" y2="0"/><line x1="2.2" y1="-3.2" x2="2.2" y2="0"/></g></g>
<g id="mgKnife"><path d="M0 0 l9 -3.4 l1.6 1.2 l-9.6 4.2 z" fill="#c2b9ab" stroke="#6f6a60" stroke-width=".35"/><path d="M-.4 .2 l-5 2.4 l-1.2 -1.8 l5.2 -2.6 z" fill="#5a4636"/></g>
<g id="mgTorch"><line x1="0" y1="0" x2="6" y2="9" stroke="#5a4636" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="0" cy="0" rx="1.6" ry="1.1" fill="#3f342a"/><use href="#mgFlame"/></g>
<g id="mgToolBucket"><line x1="0" y1="0" x2="1.6" y2="4" stroke="#6b5a44" stroke-width="1.2" stroke-linecap="round"/><g transform="translate(2.4 7) rotate(18)"><use href="#mgBucket"/></g></g>
<g id="mgStick"><line x1="0" y1="0" x2="8" y2="11" stroke="#8a7059" stroke-width="1.7" stroke-linecap="round"/><line x1="0" y1="0" x2="1.6" y2="2.4" stroke="#5a4636" stroke-width="1.7" stroke-linecap="round"/></g>
<filter id="mgHl" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="1.2" flood-color="#f7ebd2" flood-opacity=".9"/></filter>
`;

/* ---------- small helpers ---------- */
function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  parent?: Element,
): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

export function tween(
  ms: number,
  onFrame: (k: number, t: number) => void,
  onDone?: () => void,
  easing: (t: number) => number = easeInOut,
): () => void {
  let t0 = -1;
  let stopped = false;
  const f = (now: number) => {
    if (stopped) return;
    if (t0 < 0) t0 = now;
    const t = Math.min(1, (now - t0) / ms);
    onFrame(easing(t), t);
    if (t < 1) requestAnimationFrame(f);
    else if (onDone) onDone();
  };
  requestAnimationFrame(f);
  return () => {
    stopped = true;
  };
}
const later = (ms: number, cb: () => void): number => window.setTimeout(cb, ms);

/** Something in the scene the hand can take, drop things on, or point at. */
export interface Thing {
  x: number;
  y: number;
  r: number;
  w: number;
  h: number;
  visible: boolean;
  hl(v: boolean): void;
  reset(): void;
}

/** A figure or a prop: position on the outer g, everything else on the inner one. */
export interface Fig extends Thing {
  g: SVGGElement;
  inner: SVGGElement;
  home: { x: number; y: number; pose: string; flip: boolean; hidden: boolean };
  set(x: number, y: number): Fig;
  setPose(p: string): Fig;
  setFlip(v: boolean): Fig;
  offset(dx: number): void;
  show(v?: boolean): Fig;
  moveTo(x: number, y: number, ms: number, cb?: () => void): void;
  lift(): void;
  drop(): void;
}

interface FigOpts {
  pose: string;
  x: number;
  y: number;
  color?: string;
  scale?: number;
  flip?: boolean;
  r?: number;
  w?: number;
  h?: number;
  hidden?: boolean;
  markup?: string;
}

function makeFig(parent: Element, o: FigOpts): Fig {
  const g = el('g', {}, parent);
  if (o.color) g.setAttribute('color', o.color);
  const inner = el('g', {}, g);
  const use = el('use', { href: '#' + o.pose }, inner);
  if (o.markup) inner.innerHTML = o.markup;
  let dx = 0;
  let flip = !!o.flip;
  const scale = o.scale ?? 1;
  const f: Fig = {
    g,
    inner,
    x: o.x,
    y: o.y,
    r: o.r ?? 10,
    w: o.w ?? (o.r ?? 10) * 2,
    h: o.h ?? (o.r ?? 10) * 2,
    visible: !o.hidden,
    home: { x: o.x, y: o.y, pose: o.pose, flip: !!o.flip, hidden: !!o.hidden },
    set(x, y) {
      f.x = x;
      f.y = y;
      apply();
      return f;
    },
    setPose(p) {
      use.setAttribute('href', '#' + p);
      return f;
    },
    setFlip(v) {
      flip = v;
      apply();
      return f;
    },
    offset(d) {
      dx = d;
      apply();
    },
    show(v = true) {
      f.visible = v;
      g.style.display = v ? '' : 'none';
      return f;
    },
    hl(v) {
      inner.setAttribute('filter', v ? 'url(#mgHl)' : '');
    },
    moveTo(x, y, ms, cb) {
      const sx = f.x;
      const sy = f.y;
      tween(
        ms,
        (k) => {
          f.x = lerp(sx, x, k);
          f.y = lerp(sy, y, k);
          apply();
        },
        cb,
      );
    },
    lift() {
      g.parentNode?.appendChild(g);
      inner.setAttribute('transform', 'translate(0 -1.5)');
    },
    drop() {
      inner.setAttribute('transform', '');
    },
    reset() {
      f.x = f.home.x;
      f.y = f.home.y;
      dx = 0;
      flip = f.home.flip;
      f.setPose(f.home.pose);
      f.show(!f.home.hidden);
      f.hl(false);
      f.drop();
      apply();
    },
  };
  function apply() {
    g.setAttribute('transform', `translate(${f.x + dx} ${f.y}) scale(${flip ? -scale : scale} ${scale})`);
  }
  apply();
  if (o.hidden) f.show(false);
  return f;
}

/** A place on the ground things can be dropped: a soft ring that shows while hovered. */
function makeZone(parent: Element, o: { x: number; y: number; r: number }): Thing {
  const g = el('g', { transform: `translate(${o.x} ${o.y})` }, parent);
  const ring = el(
    'circle',
    { r: o.r, fill: 'none', stroke: '#e9dcbe', 'stroke-width': 0.6, opacity: 0, 'stroke-dasharray': '2 1.5' },
    g,
  );
  return {
    x: o.x,
    y: o.y,
    r: o.r,
    w: o.r * 2,
    h: o.r * 2,
    visible: true,
    hl(v) {
      ring.setAttribute('opacity', v ? '.7' : '0');
    },
    reset() {
      ring.setAttribute('opacity', '0');
    },
  };
}

export function isFig(t: Thing): t is Fig {
  return (t as Fig).g !== undefined;
}

/** How a scene reacts to the steps of an act. */
export interface ActHooks {
  arm?(): void;
  grab?(i: number): void;
  step?(i: number, kind?: string): void;
  progress?(p: number): void;
  /** A yank that did not get it. `n` is how many yanks have not worked. */
  pull?(n: number): void;
  /** It came out of their hand on this step. */
  freed?(i: number): void;
  /** It slipped out of yours, here. */
  slip?(x: number, y: number): void;
  /** Every frame the hand is at work: `on` says whether the tool is on target. */
  frame?(dt: number, on: boolean): void;
  done?(): void;
}

export interface Scene {
  /**
   * Where this was drawn. A scene is laid out around a thing in the picture,
   * and some of those things move: the well stands on whichever plot the place
   * put it on. The layer draws once and shifts the whole scene by the
   * difference, and works in the scene's own coordinates from then on.
   */
  home: { x: number; y: number };
  build(parent: Element): void;
  reset(): void;
  setVisible(v: boolean): void;
  anchorAt(spot: { x: number; y: number }): void;
  get(id: string): Thing;
  strokeAt(x0: number | null, y0?: number, x1?: number, y1?: number): void;
  acts: Record<string, ActHooks>;
}

function strokeLineOf(root: Element) {
  const line = el('line', { stroke: '#f7ebd2', 'stroke-width': 0.7, 'stroke-linecap': 'round', opacity: 0 }, root);
  return (x0: number | null, y0 = 0, x1 = 0, y1 = 0) => {
    if (x0 === null) {
      line.setAttribute('opacity', '0');
      return;
    }
    line.setAttribute('x1', String(x0));
    line.setAttribute('y1', String(y0));
    line.setAttribute('x2', String(x1));
    line.setAttribute('y2', String(y1));
    line.setAttribute('opacity', '.9');
  };
}

function all(things: Record<string, Thing>): Thing[] {
  return Object.values(things);
}

/* ================================================================
   Tam, at the fence west of the gate (CASE_SPOTS.v1_idle_hand: 604,258)
   ================================================================ */
const TAM_HOME = { x: 604, y: 258 };

function tamScene(): Scene {
  const HOME = TAM_HOME;
  const F: Record<string, Fig> = {};
  const P: Record<string, Fig> = {};
  const Z: Record<string, Thing> = {};
  let root: SVGGElement;
  let rail: SVGPathElement;
  let strokeAt: Scene['strokeAt'] = () => {};
  const GAP_HANGING = 'M602 246.4 L630 251.6';
  const GAP_MENDED = 'M602 246.4 L630 245.8';

  return {
    home: HOME,
    build(parent) {
      root = el('g', { style: 'display:none' }, parent);
      // an upper rail on the fence, with one section come loose next to him
      const fence = el('g', {}, root);
      for (let x = 570; x <= 726; x += 32) {
        const y = 254 - ((x - 560) * 4) / 172;
        el('rect', { x: x - 1.1, y: y - 12, width: 2.2, height: 13, rx: 0.6, fill: '#c3ac83', stroke: '#7b6449', 'stroke-width': 0.3 }, fence);
      }
      el('path', { d: 'M566 247.3 H602 M630 245.8 H730', stroke: '#a58a68', 'stroke-width': 1.3, 'stroke-linecap': 'round', fill: 'none' }, fence);
      rail = el('path', { d: GAP_HANGING, stroke: '#a58a68', 'stroke-width': 1.3, 'stroke-linecap': 'round', fill: 'none' }, fence);
      // the cart the field is fed from, on the grass at the left
      el('use', { href: '#mgCart', x: 470, y: 270 }, root);
      el('use', { href: '#mgLoaf', x: 466, y: 265.5 }, root);
      el('use', { href: '#mgLoaf', x: 474, y: 266 }, root);
      Z.cart = makeZone(root, { x: 470, y: 268, r: 16 });
      P.loafCart = makeFig(root, { pose: 'mgLoaf', x: 470, y: 264, r: 7 });
      // the spade, stuck in the ground next to him
      el('use', { href: '#mgSpade', x: 588, y: 270 }, root);
      // the four who dig, in the near corner of the field
      F.d1 = makeFig(root, { pose: 'mgDig', x: 478, y: 322, color: '#4d6647', flip: true });
      F.d2 = makeFig(root, { pose: 'mgDig', x: 512, y: 334, color: '#6f6a60' });
      F.d3 = makeFig(root, { pose: 'mgDig', x: 538, y: 318, color: '#8a7059', flip: true });
      F.d4 = makeFig(root, { pose: 'mgDig', x: 552, y: 346, color: '#4d6647' });
      // Tam, on the near side of the fence, hand on his back
      F.tam = makeFig(root, { pose: 'mgSitBack', x: 604, y: 264, color: '#4d6647', r: 12 });
      // his share, in his own hand: the halves appear where it was
      P.loaf = makeFig(root, { pose: 'mgLoaf', x: 611.5, y: 269, r: 7 });
      P.half = makeFig(root, { pose: 'mgHalf', x: 610, y: 269, r: 6, hidden: true });
      P.halfKept = makeFig(root, { pose: 'mgHalf', x: 613, y: 269, r: 6, hidden: true, flip: true });
      P.handles = makeFig(root, { pose: 'mgHandles', x: 640, y: 274, r: 8 });
      strokeAt = strokeLineOf(root);
    },
    reset() {
      [...all(F), ...all(P), ...all(Z)].forEach((t) => t.reset());
      rail.setAttribute('d', GAP_HANGING);
      strokeAt(null);
    },
    anchorAt(spot) {
      root.setAttribute('transform', `translate(${spot.x - HOME.x} ${spot.y - HOME.y})`);
    },
    setVisible(v) {
      root.style.display = v ? '' : 'none';
    },
    get(id) {
      const t = P[id] ?? F[id] ?? Z[id];
      if (!t) throw new Error(`no such thing in the scene: ${id}`);
      return t;
    },
    strokeAt: (x0, y0, x1, y1) => strokeAt(x0, y0, x1, y1),
    acts: {
      feed_him: {
        step() {
          F.tam.setPose('mgSitMend');
          P.loafCart.show(false);
          rail.setAttribute('d', GAP_MENDED);
          diggers('dig');
        },
      },
      half_share: {
        step(i) {
          if (i === 0) {
            // the cut: the loaf becomes two halves, and one of them is his
            P.loaf.show(false);
            P.half.set(610, 269).show(true);
            P.halfKept.set(613, 269).show(true);
            return;
          }
          P.half.show(false);
          F.tam.setPose('mgDig').set(566, 306);
          diggers('dig');
        },
      },
      /* His bread is in his hand and he does not open it. Every yank that
         comes back empty is the answer being spent rather than chosen. */
      no_work_no_bread: {
        pull: jerk,
        freed: stands,
        step() {
          P.loaf.show(false);
          F.tam.setPose('mgDig').set(574, 310).setFlip(true);
          diggers('dig');
        },
      },
      cut_his_share: {
        arm() {
          diggers('come');
        },
        pull: jerk,
        freed: stands,
        step() {
          P.loaf.show(false);
          F.tam.setPose('mgDig').set(574, 310).setFlip(true);
        },
      },
      headman_decides: {
        step() {
          P.handles.show(false);
          F.tam.setPose('mgStool').set(490, 286);
        },
      },
      his_own_field: {
        arm() {
          diggers('dig');
        },
      },
    },
  };

  /** He holds on, and the whole of him goes with the pull. */
  function jerk(n: number) {
    F.tam.offset(1.8);
    later(90, () => F.tam.offset(0));
    if (n === 1) F.d2.setPose('mgWatch').setFlip(false);
  }
  /** It is out of his hand. He gets up, which he said he could not do. */
  function stands() {
    F.tam.setPose('mgWatch').set(608, 268);
  }

  function diggers(mode: 'dig' | 'come') {
    const ds = [F.d1, F.d2, F.d3, F.d4];
    if (mode === 'dig') ds.forEach((d) => d.setPose('mgDig'));
    else
      ds.forEach((d, i) => {
        d.setPose('mgWatch').setFlip(false);
        d.moveTo(556 + i * 18, 286 + (i % 2) * 4, 700 + i * 120);
      });
  }
}

/* ================================================================
   Iva, at the north gate (CASE_SPOTS.d1_pies: 756,248)
   ================================================================ */
const IVA_HOME = { x: 756, y: 248 };

function ivaScene(): Scene {
  const HOME = IVA_HOME;
  const F: Record<string, Fig> = {};
  const P: Record<string, Fig> = {};
  const Z: Record<string, Thing> = {};
  let root: SVGGElement;
  let underline: SVGLineElement;
  let blaze: SVGGElement;
  let fire: SVGGElement;
  let f1: SVGGElement;
  let f2: SVGGElement;
  let ring: SVGCircleElement;
  let spilled: SVGGElement[] = [];
  let strokeAt: Scene['strokeAt'] = () => {};
  const RING = 69.1;

  /* Nine years old and quicker than you. She keeps the basket between the
     gate and the queue, a few steps at a time, until it is alight. */
  const DARTS = [
    { x: 738, y: 274 },
    { x: 768, y: 281 },
    { x: 744, y: 259 },
  ];
  const BASKET_AT = { x: 10, y: 7 };
  let darts = 0;
  let since = 0;
  let running = false;
  let letGo = false;
  let lit = 0;

  function crowdTurns() {
    [F.q1, F.q2, F.q3, F.b1, F.b2, F.clerk].forEach((f) => f.setPose('mgWatch').setFlip(false));
  }
  /** The fire and its ring live on the basket, wherever the basket has got to. */
  function blazeAt() {
    blaze.setAttribute('transform', `translate(${P.basket.x} ${P.basket.y - 1})`);
  }
  function carryBasket() {
    P.basket.set(F.iva.x + BASKET_AT.x, F.iva.y + BASKET_AT.y);
  }

  return {
    home: HOME,
    build(parent) {
      root = el('g', { style: 'display:none' }, parent);
      // the desk at the gate, the clerk behind it, the licence boards on it
      el('use', { href: '#mgDesk', x: 804, y: 292 }, root);
      F.clerk = makeFig(root, { pose: 'mgStand', x: 806, y: 282, color: '#6f6a60' });
      Z.desk = makeZone(root, { x: 802, y: 290, r: 12 });
      el('use', { href: '#mgBoard', x: 808.6, y: 288.4, opacity: 0.9 }, root);
      P.board = makeFig(root, { pose: 'mgBoard', x: 808, y: 289, r: 5 });
      // the two wardens, one with the slate
      F.w1 = makeFig(root, { pose: 'mgStand', x: 736, y: 280, color: '#5c7f86' });
      F.w2 = makeFig(root, { pose: 'mgStand', x: 774, y: 282, color: '#5c7f86', flip: true });
      P.slate = makeFig(root, { pose: 'mgSlate', x: 781, y: 272, r: 6, w: 10.4, h: 7.6 });
      underline = el('line', { x1: 777.4, y1: 274.2, x2: 784.6, y2: 274.2, stroke: '#e9dcbe', 'stroke-width': 0.45, opacity: 0 }, root);
      // the queue along the road behind her
      F.q1 = makeFig(root, { pose: 'mgStand', x: 824, y: 310, color: '#4d6647' });
      F.q2 = makeFig(root, { pose: 'mgStand', x: 842, y: 326, color: '#6f6a60' });
      F.q3 = makeFig(root, { pose: 'mgStand', x: 862, y: 340, color: '#8a7059' });
      // two bakers, by the hut, counting
      F.b1 = makeFig(root, { pose: 'mgStand', x: 700, y: 302, color: '#c8a24a' });
      F.b2 = makeFig(root, { pose: 'mgStand', x: 712, y: 314, color: '#c8a24a', flip: true });
      // the Guild, at the right of the frame, with a cart and its colours
      el('use', { href: '#mgCart', x: 890, y: 306 }, root);
      el('use', { href: '#mgBanner', x: 883, y: 303 }, root);
      F.guild = makeFig(root, { pose: 'mgStand', x: 878, y: 298, color: '#3a3128', flip: true });
      Z.guild = makeZone(root, { x: 884, y: 302, r: 14 });
      // Iva, and the basket at her feet
      P.basket = makeFig(root, { pose: 'mgBasket', x: 762, y: 273, r: 8 });
      F.iva = makeFig(root, { pose: 'mgChild', x: 752, y: 266, color: '#c96a5a', r: 9 });
      P.coin = makeFig(root, { pose: 'mgCoin', x: 758, y: 272, r: 4, hidden: true });
      P.receipt = makeFig(root, { pose: 'mgReceipt', x: 802, y: 288, r: 3, hidden: true });
      P.stall = makeFig(root, { pose: 'mgStall', x: 762, y: 268, r: 10, hidden: true });
      // the fire and its ring, which ride on the basket
      P.ash = makeFig(root, { pose: 'mgAsh', x: 762, y: 273, r: 6, hidden: true });
      blaze = el('g', { transform: 'translate(762 272)' }, root);
      fire = el('g', { opacity: 0 }, blaze);
      f1 = el('g', { transform: 'translate(-2 0)' }, fire);
      el('use', { href: '#mgFlame' }, f1);
      f2 = el('g', { transform: 'translate(2.4 .6) scale(.8)' }, fire);
      el('use', { href: '#mgFlame' }, f2);
      ring = el(
        'circle',
        { cx: 0, cy: 0, r: 11, fill: 'none', stroke: '#f3c25a', 'stroke-width': 0.9, 'stroke-dasharray': RING, 'stroke-dashoffset': RING, transform: 'rotate(-90)', opacity: 0 },
        blaze,
      );
      strokeAt = strokeLineOf(root);
    },
    reset() {
      [...all(F), ...all(P), ...all(Z)].forEach((t) => t.reset());
      underline.setAttribute('opacity', '0');
      fire.setAttribute('opacity', '0');
      ring.setAttribute('opacity', '0');
      ring.setAttribute('stroke-dashoffset', String(RING));
      blaze.setAttribute('transform', 'translate(762 272)');
      spilled.forEach((s) => s.remove());
      spilled = [];
      darts = 0;
      since = 0;
      running = false;
      letGo = false;
      lit = 0;
      strokeAt(null);
    },
    anchorAt(spot) {
      root.setAttribute('transform', `translate(${spot.x - HOME.x} ${spot.y - HOME.y})`);
    },
    setVisible(v) {
      root.style.display = v ? '' : 'none';
    },
    get(id) {
      const t = P[id] ?? F[id] ?? Z[id];
      if (!t) throw new Error(`no such thing in the scene: ${id}`);
      return t;
    },
    strokeAt: (x0, y0, x1, y1) => strokeAt(x0, y0, x1, y1),
    acts: {
      reward: {
        step() {
          P.board.show(false);
          P.basket.show(false);
          P.stall.show(true);
          F.iva.set(766, 262).setFlip(true);
          F.b1.setPose('mgWatch');
          F.b2.setPose('mgWatch').setFlip(false);
        },
      },
      nothing: {
        step() {
          underline.setAttribute('opacity', '1');
          F.w2.set(770, 278);
          P.slate.set(779, 264);
          F.b1.setPose('mgWatch');
          F.b2.setPose('mgWatch').setFlip(false);
        },
      },
      barred: {
        arm() {
          F.w1.setPose('mgWatch');
          F.w2.setPose('mgWatch').setFlip(false);
        },
        /* She takes the basket away from the flame. Three times, in a few
           steps each, and then it has caught and she cannot help it. */
        frame(dt, on) {
          blazeAt();
          if (running || letGo) return;
          if (darts >= DARTS.length || lit >= 0.5) {
            letGo = true;
            F.iva.setPose('mgChildBehind');
            F.iva.set(F.iva.x - 7, F.iva.y - 2);
            return;
          }
          if (!on) {
            since = 0;
            return;
          }
          since += dt;
          if (since < 450) return;
          since = 0;
          running = true;
          const spot = DARTS[darts];
          darts += 1;
          F.iva.setFlip(spot.x < F.iva.x);
          F.iva.moveTo(spot.x, spot.y, 360, () => {
            running = false;
            F.iva.setFlip(false);
          });
          P.basket.moveTo(spot.x + BASKET_AT.x, spot.y + BASKET_AT.y, 360);
        },
        progress(p) {
          lit = p;
          fire.setAttribute('opacity', p > 0 ? String(0.25 + 0.75 * p) : '0');
          f1.setAttribute('transform', `translate(-2 0) scale(${0.3 + p * 1.1})`);
          f2.setAttribute('transform', `translate(2.4 .6) scale(${0.2 + p * 0.9})`);
          ring.setAttribute('opacity', p > 0 ? '.9' : '0');
          ring.setAttribute('stroke-dashoffset', String(RING * (1 - p)));
          if (p > 0.3) crowdTurns();
        },
        done() {
          P.ash.set(P.basket.x, P.basket.y).show(true);
          P.basket.show(false);
          F.iva.setPose('mgChildBehind');
          ring.setAttribute('opacity', '0');
          later(500, () => fire.setAttribute('opacity', '0'));
        },
      },
      fine_anyway: {
        arm() {
          F.w1.setPose('mgStand').setFlip(true);
          F.w2.setPose('mgStand').setFlip(false);
          F.b1.setPose('mgWatch');
          F.b2.setPose('mgWatch').setFlip(false);
        },
        step(i, kind) {
          // what falls out of her lands on the ground and stays there
          const g = el('g', { transform: 'translate(748 262)' }, root);
          el('use', { href: kind === 'pie' ? '#mgPie' : '#mgCoin' }, g);
          spilled.push(g);
          const x = 746 + (i - 1) * 3.2 + (i % 2) * 1.2;
          const y = 276 + (i % 3) * 1.1;
          tween(
            260,
            (k) => g.setAttribute('transform', `translate(${lerp(748, x, k)} ${lerp(262, y, easeOut(k))})`),
            undefined,
            (t) => t,
          );
        },
        done() {
          P.basket.show(false);
        },
      },
      toll: {
        arm() {
          P.coin.show(true);
        },
        step() {
          P.coin.show(false);
          P.receipt.show(true);
          later(400, () => P.receipt.moveTo(757, 268, 500));
          F.iva.set(792, 288).setFlip(true);
          P.basket.set(797, 294);
        },
      },
      /* She comes if she is pulled and stops coming the moment you stop. */
      guild: {
        arm() {
          F.iva.setPose('mgChildBehind');
        },
        frame() {
          carryBasket();
        },
        step() {
          P.basket.set(896, 300);
          F.iva.setFlip(true);
          F.guild.setPose('mgWatch');
        },
      },
    },
  };
}

/* ================================================================
   The one from the road, at the post by the east road
   (CASE_SPOTS.v6_road_dead: 872,376)
   ================================================================ */
const ROAD_HOME = { x: 872, y: 376 };

function roadScene(): Scene {
  const HOME = ROAD_HOME;
  const F: Record<string, Fig> = {};
  const P: Record<string, Fig> = {};
  const Z: Record<string, Thing> = {};
  const standing: Fig[] = [];
  let root: SVGGElement;
  let pinned: SVGUseElement;
  let beyond: SVGEllipseElement;
  let shelter: SVGUseElement;
  let stains: SVGGElement;

  /**
   * He is heavier than a decision. Where the hand loses him he goes down, and
   * the road keeps the place: the way you carried him is on the ground
   * afterwards, in front of everybody, for as long as the scene lasts.
   */
  function stain(x: number, y: number) {
    const g = el('g', { transform: `translate(${x} ${y})` }, stains);
    el('ellipse', { cx: 0, cy: 3.2, rx: 5.4, ry: 1.9, fill: '#4b342c', opacity: 0.5 }, g);
    el('ellipse', { cx: 3.2, cy: 4.4, rx: 2.1, ry: 0.9, fill: '#4b342c', opacity: 0.38 }, g);
    el('ellipse', { cx: -3.6, cy: 4.1, rx: 1.4, ry: 0.7, fill: '#4b342c', opacity: 0.32 }, g);
  }

  function everybodyStands() {
    F.f1.setPose('mgWatch').setFlip(false);
    F.f2.setPose('mgWatch');
    F.f1.moveTo(912, 430, 1500);
    F.f2.moveTo(926, 422, 1600);
    standing.forEach((s, i) => {
      s.setPose('mgWatch');
      s.moveTo(914 + (i % 3) * 14, 434 + Math.floor(i / 3) * 12 + (i % 2) * 5, 1200 + i * 150);
    });
    F.chaplain.moveTo(958, 440, 1800);
  }
  function buried() {
    P.man.show(false);
    P.tag.show(false);
    P.mound.show(true);
  }

  return {
    home: HOME,
    build(parent) {
      root = el('g', { style: 'display:none' }, parent);
      // the post the road goes past, with its lantern
      el('use', { href: '#mgPost', x: 886, y: 366 }, root);
      Z.post = makeZone(root, { x: 886, y: 360, r: 11 });
      pinned = el('use', { href: '#mgLaw', x: 886, y: 358, opacity: 0 }, root);
      // the last marker, down the road towards the bridge
      el('use', { href: '#mgStone', x: 1012, y: 444 }, root);
      Z.stone = makeZone(root, { x: 1018, y: 440, r: 15 });
      beyond = el('ellipse', { cx: 1030, cy: 450, rx: 9, ry: 3, fill: '#3d4a34', opacity: 0 }, root);
      // the edge: two crosses past the last roof, and the pile beside them
      el('use', { href: '#mgCross', x: 934, y: 446 }, root);
      el('use', { href: '#mgCross', x: 942, y: 450 }, root);
      Z.edge = makeZone(root, { x: 940, y: 452, r: 15 });
      P.mound = makeFig(root, {
        pose: 'mgCross',
        markup: '<ellipse rx="7" ry="2.4" fill="#6b5744" opacity=".85"/><use href="#mgCross" x="0" y="-1"/>',
        x: 951,
        y: 455,
        r: 6,
        hidden: true,
      });
      el('use', { href: '#mgPile', x: 968, y: 462 }, root);
      Z.pile = makeZone(root, { x: 968, y: 461, r: 11 });
      // the shade of a roof, for a man being held for an answer
      shelter = el('use', { href: '#mgShelter', x: 900, y: 352, opacity: 0 }, root);
      // two at the granary with sacks, and the ones who will come and stand
      F.f1 = makeFig(root, { pose: 'mgDig', x: 976, y: 398, color: '#4d6647', flip: true });
      F.f2 = makeFig(root, { pose: 'mgDig', x: 1002, y: 406, color: '#8a7059' });
      ['#6f6a60', '#4d6647', '#8a7059', '#c8a24a', '#6f6a60'].forEach((c, i) => {
        standing.push(makeFig(root, { pose: 'mgStand', x: 760 + i * 20, y: 470 + (i % 2) * 8, color: c }));
      });
      // the chaplain, and the rider waiting with a horse by the well
      F.chaplain = makeFig(root, { pose: 'mgStand', x: 852, y: 394, color: '#4d4a40' });
      el('use', { href: '#mgHorse', x: 826, y: 408 }, root);
      F.rider = makeFig(root, { pose: 'mgStand', x: 838, y: 396, color: '#6f6a60', flip: true });
      Z.rider = makeZone(root, { x: 832, y: 402, r: 13 });
      // where he went down on the way, which the ground keeps
      stains = el('g', {}, root);
      // the man, on the road at the post, the name in his coat showing
      P.man = makeFig(root, { pose: 'mgLie', x: 872, y: 380, r: 12, color: '#6f6a60' });
      P.tag = makeFig(root, { pose: 'mgTag', x: 873, y: 378.6, r: 4 });
      P.coat = makeFig(root, { pose: 'mgCoat', x: 932, y: 442, r: 6, hidden: true });
      P.law = makeFig(root, { pose: 'mgLaw', x: 858, y: 388, r: 5, hidden: true });
    },
    reset() {
      [...all(F), ...all(P), ...all(Z), ...standing].forEach((t) => t.reset());
      pinned.setAttribute('opacity', '0');
      beyond.setAttribute('opacity', '0');
      shelter.setAttribute('opacity', '0');
      while (stains.firstChild) stains.removeChild(stains.firstChild);
    },
    anchorAt(spot) {
      root.setAttribute('transform', `translate(${spot.x - HOME.x} ${spot.y - HOME.y})`);
    },
    setVisible(v) {
      root.style.display = v ? '' : 'none';
    },
    get(id) {
      const t = P[id] ?? F[id] ?? Z[id];
      if (!t) throw new Error(`no such thing in the scene: ${id}`);
      return t;
    },
    strokeAt() {},
    acts: {
      ours_now: {
        grab() {
          P.tag.show(false);
          F.chaplain.setPose('mgWatch');
        },
        slip: stain,
        step() {
          buried();
          everybodyStands();
        },
      },
      send_word: {
        step() {
          P.tag.show(false);
          F.rider.set(832, 400).setFlip(false);
          later(200, () => F.rider.moveTo(1040, 470, 1700));
          later(2000, () => F.rider.show(false));
          shelter.setAttribute('opacity', '1');
          P.man.moveTo(900, 356, 900);
        },
      },
      past_the_boundary: {
        grab() {
          P.tag.show(false);
        },
        slip: stain,
        step() {
          P.man.show(false);
          beyond.setAttribute('opacity', '.55');
          F.chaplain.setPose('mgWatch');
        },
      },
      the_day_for_him: {
        arm() {
          P.law.show(true);
        },
        step() {
          P.law.show(false);
          pinned.setAttribute('opacity', '1');
          F.f1.setPose('mgWatch').setFlip(false);
          F.f2.setPose('mgWatch');
          later(700, () => {
            P.tag.show(false);
            P.man.moveTo(940, 452, 1200, () => {
              buried();
              everybodyStands();
            });
          });
        },
      },
      no_house_no_burial: {},
      edge_same_day: {
        grab(i) {
          if (i === 0) P.tag.show(false);
        },
        slip: stain,
        step(i) {
          if (i === 0) {
            P.man.show(false);
            P.mound.show(true);
            P.coat.set(932, 442).show(true);
          } else P.coat.show(false);
        },
      },
    },
  };
}


/* ================================================================
   The well, four buckets a day (CASE_SPOTS.v2_well: 790,448)

   The one scene that has to be able to stand somewhere else: the well is
   built on whichever plot the place chose for it, so everything here is
   drawn around the well and moved with it.
   ================================================================ */
const WELL_HOME = { x: 790, y: 448 };

function wellScene(): Scene {
  const HOME = WELL_HOME;
  const F: Record<string, Fig> = {};
  const P: Record<string, Fig> = {};
  const Z: Record<string, Thing> = {};
  let root: SVGGElement;
  let spilled: SVGGElement[] = [];
  let strokeAt: Scene['strokeAt'] = () => {};
  const queue: Fig[] = [];
  const PEBBLES = [
    { x: 772, y: 466 },
    { x: 780, y: 468 },
    { x: 776, y: 471 },
  ];

  function drinks(f: Fig) {
    f.setPose('mgWatch');
  }
  function queueWatches() {
    [...queue, F.weak, F.buyer].forEach((f) => f.setPose('mgWatch').setFlip(false));
  }

  return {
    home: HOME,
    build(parent) {
      root = el('g', { style: 'display:none' }, parent);
      // the rope over the well, and the bucket standing on the kerb
      el('path', { d: 'M790 420 v10', stroke: '#7b6449', 'stroke-width': 0.7 }, root);
      P.bucket = makeFig(root, { pose: 'mgBucket', x: 806, y: 450, r: 7 });
      // the crown's own cup, on the beam where it always sits
      P.crownCup = makeFig(root, { pose: 'mgCupCrown', x: 776, y: 428, r: 5 });
      // the hat the lots are drawn out of
      P.hat = makeFig(root, { pose: 'mgHat', x: 772, y: 458, r: 7 });
      // the plank of thin cups, west of the well
      P.cups = makeFig(root, { pose: 'mgPlank', x: 712, y: 458, r: 22, w: 44, h: 10 });
      // the two who dig, coming up from the field with their spades
      F.d1 = makeFig(root, { pose: 'mgDig', x: 738, y: 472, color: '#4d6647', flip: true });
      F.d2 = makeFig(root, { pose: 'mgDig', x: 722, y: 484, color: '#6f6a60' });
      Z.diggers = makeZone(root, { x: 732, y: 478, r: 16 });
      // the weakest, at the front, with her cup
      F.weak = makeFig(root, { pose: 'mgStand', x: 818, y: 462, color: '#6f6a60', flip: true });
      P.cup = makeFig(root, { pose: 'mgCup', x: 823, y: 464, r: 5 });
      // the queue behind her, down the lane
      queue.push(makeFig(root, { pose: 'mgStand', x: 836, y: 476, color: '#4d6647', flip: true }));
      queue.push(makeFig(root, { pose: 'mgStand', x: 850, y: 488, color: '#8a7059', flip: true }));
      queue.push(makeFig(root, { pose: 'mgStand', x: 864, y: 500, color: '#6f6a60', flip: true }));
      Z.queueEnd = makeZone(root, { x: 878, y: 512, r: 13 });
      // the fool, who is the one who says the arithmetic out loud
      F.fool = makeFig(root, { pose: 'mgStand', x: 764, y: 448, color: '#c8a24a' });
      // and whoever has something left to pay with
      F.buyer = makeFig(root, { pose: 'mgStand', x: 884, y: 468, color: '#c8a24a', flip: true });
      Z.buyer = makeZone(root, { x: 884, y: 474, r: 14 });
      P.coin = makeFig(root, { pose: 'mgCoinUp', x: 884, y: 458, r: 4, hidden: true });
      strokeAt = strokeLineOf(root);
    },
    anchorAt(spot) {
      root.setAttribute('transform', `translate(${spot.x - HOME.x} ${spot.y - HOME.y})`);
    },
    setVisible(v) {
      root.style.display = v ? '' : 'none';
    },
    reset() {
      [...all(F), ...all(P), ...all(Z), ...queue].forEach((t) => t.reset());
      spilled.forEach((g) => g.remove());
      spilled = [];
      strokeAt(null);
    },
    get(id) {
      const t = P[id] ?? F[id] ?? Z[id];
      if (!t) throw new Error(`no such thing in the scene: ${id}`);
      return t;
    },
    strokeAt: (x0, y0, x1, y1) => strokeAt(x0, y0, x1, y1),
    acts: {
      /* the bucket is in your hand for this one, so it is not on the kerb */
      share_thin: {
        arm() {
          P.bucket.show(false);
        },
        step() {
          P.cups.setPose('mgPlankWet');
          [...queue, F.weak].forEach(drinks);
          F.d1.setPose('mgWatch').setFlip(false);
          F.d2.setPose('mgWatch');
        },
      },
      /* one pebble a morning, and the hat says who goes without */
      draw_lots: {
        arm() {
          queueWatches();
        },
        step(i) {
          const spot = PEBBLES[Math.min(i, PEBBLES.length) - 1];
          if (!spot) return;
          const g = el('g', { transform: `translate(${P.hat.x} ${P.hat.y - 4})` }, root);
          el('use', { href: '#mgPebble' }, g);
          spilled.push(g);
          tween(
            300,
            (k) =>
              g.setAttribute(
                'transform',
                `translate(${lerp(P.hat.x, spot.x, k)} ${lerp(P.hat.y - 4, spot.y, easeOut(k))})`,
              ),
            undefined,
            (t) => t,
          );
        },
      },
      /* her cup, out of her hand, in front of the people behind her */
      weakest_waits: {
        arm() {
          queueWatches();
        },
        pull() {
          F.weak.offset(-1.6);
          later(90, () => F.weak.offset(0));
        },
        freed() {
          F.weak.setPose('mgWatch').setFlip(false);
        },
        step() {
          P.cup.show(false);
          drinks(F.d1);
          F.d1.setFlip(false);
          drinks(F.d2);
        },
      },
      /* the same water, and a law of yours that says it is shared alike */
      diggers_first: {
        arm() {
          queueWatches();
          F.weak.set(810, 458);
        },
        pull() {
          F.weak.offset(-1.6);
          later(90, () => F.weak.offset(0));
        },
        freed() {
          F.weak.setPose('mgWatch').setFlip(false);
        },
        step() {
          drinks(F.d1);
          F.d1.setFlip(false);
          drinks(F.d2);
        },
      },
      /* you go to the back, which is a thing everybody can see from where they are */
      headman_drinks_last: {
        step() {
          queueWatches();
          F.fool.set(872, 506);
        },
      },
      /* the last bucket, and whoever still has something to pay with */
      sell_the_bucket: {
        arm() {
          queueWatches();
        },
        step() {
          P.coin.show(true);
          later(250, () => P.coin.moveTo(784, 434, 600));
          F.buyer.setPose('mgStand').setFlip(true);
          [...queue, F.weak].forEach((f) => f.setFlip(true));
        },
      },
    },
  };
}

export const SCENES: Record<string, Scene> = {
  v1_idle_hand: tamScene(),
  v2_well: wellScene(),
  d1_pies: ivaScene(),
  v6_road_dead: roadScene(),
};
