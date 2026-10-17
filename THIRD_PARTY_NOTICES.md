# React Bits adaptations

The Spotlight Card, Gradient Text, Animated Content, and Pill Nav treatments in
`refresh.css` and `site.js` adapt React Bits by David Haz to this static website.
Copyright (c) 2026 David Haz. The full MIT + Commons Clause notice is retained in
`assets/react-bits-LICENSE.txt` and included in the published site.

Reviewed upstream revision: `482ab1cd3f567467a8dc9f49683bcefe54223e2c`.
Source: https://github.com/DavidHDev/react-bits/tree/482ab1cd3f567467a8dc9f49683bcefe54223e2c/src/content

- `Components/SpotlightCard/SpotlightCard.jsx`: pointer-position radial highlight.
- `TextAnimations/GradientText/GradientText.jsx`: clipped gradient text.
- `Animations/AnimatedContent/AnimatedContent.jsx`: a short entrance when visible.
- `Components/PillNav/PillNav.jsx`: rounded navigation and active/hover treatments.

These are website-specific adaptations, with native CSS and browser APIs instead
of React, GSAP, or React Router. Keyboard focus, touch, reduced motion, no-script
browsing, and offscreen animation pausing are handled by this site.
