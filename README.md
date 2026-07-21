# CSARCH2 Virtual Exhibit: Cache Memory Visualizer

An interactive virtual exhibit demonstrating **Cache Memory Mechanisms (Hits, Misses, and Locality)** using **Astro**, **React**, and **Framer Motion**.

---

# Group Information

**Group Title:** Ca-Ching! (Group 5)

---

# Group Members

| Name | Role |
|------|------|
| Barreo, Carlo Gabriel | Member |
| Eleydo, Renzel Vince | Member |
| Gregorio, Gaibril Kyle | Member |
| Leano, Jeremy | Member |
| Rebudiao, Daniel Christian | Member |

---

# Topic Theme

## Caching! — How Cache Memory Works

---

---

# Final Documentation

This section documents the complete development journey of the **CSARCH2 Virtual Exhibit: Cache Memory Visualizer**. Rather than only describing the final product, this documentation records how the project evolved from the initial proposal to the completed implementation, including the discussions, design decisions, technical breakthroughs, challenges encountered, and lessons learned throughout development.

---

## 1. Phase 1 — Initial Proposal and Project Planning

The project initially began with the objective of creating an educational virtual exhibit for the CSARCH2 course that would explain a computer architecture topic through an interactive experience rather than a traditional presentation.

During the planning stage, several possible topics and implementation ideas were discussed. Our original scope focused on broader CPU architecture concepts, including the Fetch–Decode–Execute cycle. However, after evaluating the amount of content that needed to be explained within a limited exhibit space, we realized that narrowing the scope would allow us to provide a much deeper and more interactive learning experience.

After several discussions, the group decided to focus specifically on **Cache Memory Mechanisms**, particularly:

- Cache Hits
- Cache Misses
- Cache Locality
- Memory Access Latency
- Address Mapping

This narrower topic allowed us to dedicate more effort toward creating an interactive simulator instead of overwhelming users with excessive theoretical information.

During this stage, we also established the following project goals:

- Build an exhibit that is educational yet interactive.
- Allow visitors to experiment with cache memory concepts instead of simply reading about them.
- Present technical concepts visually through animations.
- Ensure compatibility with the official Astro Virtual Exhibit template.
- Design the simulator so that beginners could easily understand cache operations.

---

## 2. Phase 2 — Choosing the Technical Architecture

Once the topic had been finalized, the next major discussion centered around selecting the appropriate technologies.

Several implementation approaches were considered. Because the official exhibit template was built using Astro while our planned simulator required significant client-side interactivity, we discussed how both technologies could coexist.

After researching Astro's architecture, we concluded that the project should separate responsibilities between content rendering and interactive behavior.

The architecture evolved into the following design:

- **Astro**
  - Responsible for the virtual exhibit structure
  - Static content rendering
  - MDX pages
  - SEO and page organization

- **React**
  - Responsible for interactive components
  - CPU cache simulator
  - User input handling
  - Cache visualization
  - State management

- **Framer Motion**
  - Interactive animations
  - Visual transitions
  - Data movement
  - Cache hit and miss effects

This separation significantly simplified development because educational content could remain inside Astro while all dynamic behavior stayed inside React components.

---

## 3. Phase 3 — Simulator Planning

The simulator underwent numerous revisions before implementation began.

Initially, the simulator was envisioned as a simple calculator that would only determine whether an address resulted in a hit or a miss.

However, after discussing the educational objectives of the exhibit, we realized that simply displaying "Hit" or "Miss" would not effectively teach cache memory concepts.

Instead, we redesigned the simulator to demonstrate the entire cache lookup process.

The revised simulator would now:

- Accept hexadecimal memory addresses
- Convert addresses into binary
- Divide addresses into Tag, Index, and Offset
- Highlight the selected cache row
- Compare cache tags
- Determine hit or miss
- Show cache updates after misses
- Display memory access latency
- Update cache contents dynamically

This redesign transformed the simulator from a simple calculator into a visual educational tool.

---

## 4. Technical Discussions Throughout Development

### Address Mapping

One of the earliest technical discussions involved how addresses should be processed.

Instead of hardcoding examples, we decided that every user input should undergo the actual cache lookup process.

The simulator therefore performs:

1. Hexadecimal input validation
2. Binary conversion
3. Address decomposition
4. Cache indexing
5. Tag comparison
6. Hit/Miss determination
7. Cache update
8. Latency calculation

This mirrors the sequence used by actual cache hardware.

---

### Cache Configuration

We also discussed how realistic the cache should be.

A fully configurable cache simulator would require users to understand associativity, replacement algorithms, cache sizes, and block sizes before they could even begin using the exhibit.

To keep the exhibit educational and approachable, we fixed the cache configuration while still demonstrating the essential mechanisms.

This allowed visitors to focus on understanding cache behavior rather than configuration complexity.

---

### Locality Concepts

Another important discussion centered around how to demonstrate locality.

Instead of explaining locality only through text, we decided to reinforce the concept through simulator behavior.

The simulator naturally demonstrates:

- Temporal locality by allowing repeated accesses to become hits.
- Spatial locality by loading memory blocks after misses.

This integration helped connect theoretical concepts with observable behavior.

---

### Implementation Decisions

Several implementation choices were made to improve maintainability:

- Separate simulator logic from presentation components.
- Keep cache calculations independent from animations.
- Store cache state using React state management.
- Use reusable UI components whenever possible.
- Keep Astro pages focused on documentation while React handled interactivity.

This modular approach greatly simplified debugging and future improvements.

---

## 5. Creative Discussions

The exhibit experienced numerous visual redesigns throughout development.

### Visual Theme

The group agreed that traditional educational interfaces often feel static and difficult to engage with.

Instead, we adopted a futuristic glassmorphism-inspired design using:

- Dark backgrounds
- Glowing cache blocks
- Animated highlights
- Smooth transitions
- Neon accents

This visual identity aligned with the concept of computer hardware while making the exhibit more engaging.

---

### Layout Improvements

Several layout iterations were discussed.

Originally, the simulator occupied nearly the entire page.

As development progressed, we realized users also needed room for explanations and educational content.

The layout gradually evolved into:

- Informational sections
- Interactive simulator
- Cache visualization
- References
- Documentation

This balance ensured users could both learn and experiment without constantly switching pages.

---

### HIT and MISS Pop-ups

One of the group's favorite creative additions was the animated HIT and MISS indicators.

Originally, the simulator simply changed text after each lookup.

During discussion, we realized users needed immediate visual feedback.

The simulator was redesigned to display animated HIT and MISS pop-ups accompanied by smoother transitions, making cache operations feel more interactive and game-like.

These effects significantly improved user engagement while reinforcing the concepts being demonstrated.

---

### Animation Decisions

Numerous animation concepts were considered.

Instead of adding animations solely for aesthetic purposes, every animation was designed to reinforce learning.

Examples include:

- Address calculations
- Binary conversion
- Cache lookup highlighting
- Cache row updates
- Memory fetch animations
- Latency visualization
- Cache hit indicators
- Cache miss indicators

Each animation corresponds directly to an actual cache operation.

---

## 6. Aha Moments and Breakthroughs

Throughout development, several moments significantly improved the project.

### Discovering Astro Client Directives

One major breakthrough occurred when we learned how Astro's client directives worked.

Initially, React components were not rendering correctly.

After researching Astro's hydration system, we discovered that using `client:load` allowed the simulator to function properly inside MDX pages.

This solved one of the biggest integration issues early in development.

---

### Separating Logic from Presentation

Another important realization came during debugging.

Originally, simulator calculations and animations were tightly coupled.

This made debugging difficult because visual problems often appeared to be logic errors.

Separating simulation logic from UI components dramatically improved maintainability and made future enhancements much easier.

---

### CSS Isolation

A significant breakthrough occurred after hours of debugging unexpected styling changes.

We eventually realized that multiple stylesheets were overriding one another.

By isolating simulator-specific styles and minimizing conflicts with Astro's global styles, layout consistency improved across the entire exhibit.

---

### Simplifying the User Experience

Another important realization was that educational tools should prioritize clarity over complexity.

Although several advanced cache configuration options were considered, we recognized that hiding unnecessary complexity allowed users to focus on understanding cache mechanisms rather than learning simulator controls.

---

## 7. Challenges Encountered

### Astro and React Integration

Integrating an existing React application into Astro required learning an entirely new framework.

Understanding hydration, MDX integration, and client directives required considerable experimentation before the simulator functioned correctly.

---

### CSS Conflicts

One of the longest debugging sessions involved CSS conflicts.

Issues included:

- Missing background patterns
- Incorrect dark mode colors
- Unexpected typography changes
- Component spacing inconsistencies
- Conflicting global styles
- Simulator-specific styling overriding exhibit styling

These were resolved through careful stylesheet organization and component isolation.

---

### Layout Dead Space

As more features were added, unused whitespace became increasingly noticeable.

The group repeatedly adjusted spacing, alignment, component sizing, and section organization to reduce dead space while maintaining readability.

Several iterations of the exhibit layout were produced before arriving at the final design.

---

### Typography and Styling

The exhibit underwent several typography refinements.

Challenges included:

- Heading consistency
- Font sizing
- Readability
- Mobile responsiveness
- Visual hierarchy

The final version adopted cleaner typography with improved spacing and consistent styling across sections.

---

### Responsive Design

Ensuring that both desktop and mobile layouts worked properly required multiple revisions.

Components occasionally overflowed smaller screens, requiring responsive grids and layout adjustments until the exhibit behaved consistently across devices.

---

### Simulator Complexity

Balancing educational value with simplicity proved challenging.

Too much technical detail risked overwhelming users, while too little reduced educational effectiveness.

Several iterations were required before arriving at a simulator that remained accurate while still being approachable.

---

## 8. Other Development Discussions

Throughout development, numerous smaller discussions also contributed to the final project.

These included:

- Organizing repository structure
- Improving component modularity
- Naming conventions
- Documentation formatting
- Improving code readability
- Refactoring repeated logic
- Enhancing simulator responsiveness
- Improving animation timing
- Refining educational explanations
- Updating references
- Ensuring compatibility with the virtual exhibit template
- Preparing repository documentation for final submission

Although individually small, these refinements collectively improved the quality and maintainability of the project.

---

## 9. Development Timeline Summary

The project's progression can be summarized as follows:

1. Initial brainstorming and proposal
2. Topic refinement to Cache Memory
3. Technology stack selection
4. Architecture planning
5. Simulator planning
6. Astro integration
7. React implementation
8. Cache simulator development
9. Animation development
10. Styling improvements
11. Layout refinements
12. Debugging and optimization
13. Documentation
14. Final polishing and submission preparation

Each stage built upon the previous one, resulting in a progressively more polished and educational exhibit.

---

# Final Project Status

## ✅ Completed

- Complete Astro virtual exhibit implementation
- Interactive React-based CPU Cache Visualizer
- Hexadecimal address parsing and binary conversion
- Tag, Index, and Offset visualization
- Cache lookup simulation
- Cache Hit and Cache Miss detection
- Dynamic cache table updates
- Memory latency comparison
- Cache state visualization
- Animated HIT/MISS feedback
- Responsive desktop and mobile layouts
- Glassmorphism-inspired UI and visual improvements
- Integration of React components within Astro using `client:load`
- MDX exhibit pages with educational content
- References and citations
- AI/LLM disclosure
- Comprehensive README documentation, including the complete development journey

## 📚 Learning Outcomes

Through this project, the team gained practical experience with:

- Astro framework development
- React integration within Astro
- MDX content authoring
- TailwindCSS styling
- Framer Motion animations
- Cache memory simulation
- Component-based software architecture
- Debugging CSS conflicts
- Responsive web development
- Technical documentation practices
- Collaborative software development

## 🚀 Future Improvements

Although the project has reached its intended objectives, several enhancements could be explored in future iterations:

- Configurable cache sizes and associativity
- Multiple cache replacement policies (FIFO, LRU, Random)
- Multi-level cache (L1, L2, and L3) simulation
- Step-by-step execution mode
- Additional educational quizzes and interactive activities
- Performance statistics dashboard
- More advanced animation effects
- Accessibility improvements
- Expanded cache memory scenarios and demonstrations

Overall, the project successfully evolved from an initial concept into a fully functional educational virtual exhibit that combines technical accuracy, interactive visualization, and engaging design to help users understand cache memory mechanisms in an intuitive and memorable way.

# Disclosure on the use of AI/LLM

Artificial Intelligence (AI) tools such as **ChatGPT**, **ClaudeAI**, and **Deepseek** were used during the development of the project to help with productivity and supplementary tool for learning. 

AI assistance was used for: 
- Explaining how to integrate React components to the Astro exhibit template.
- Explaining Astro, MDX, and TailwindCSS concepts and how to use them properly in the project.
- Troubleshooting integration issues between Astro and React components.
- Clarifying concepts related to cache memory simulation.

All AI-generated suggestions were verified, reviewed, and tested before incorporating it into the project. All the final implementation, design decisions, debugging, and deliverables were our full responsibility. 

# Mid-Milestone README part

# Development Progress

- **Project Setup**
  - Setup the Astro virtual exhibit template.
  - Integrated the React components into the Astro Project.
  - Configured our own MDX pages for the exhibit.
  - Imported TailwindCSS and supporting UI libraries for the visualizer.

- **CPU Cache Simulator**
  - Implemented the CPU Cache Simulator with the following features:
    - Hexadecimal address input
    - Address parsing
    - Cache Lookup simulation
    - Cache Hit and Cache Miss Visualization
    - Latency Comparison
    - Cache Table Visualization
  - Added animations for the following features:
    - Calculating
    - Force Cache Hit
    - Force Cache Miss
    - Cache Hit
    - Cache Miss

- **Exhibit Integration**
  - Embedded the React simulator into the Astro exhibit page.
  - Added project metadata:
    - Title
    - Author list
    - Reading time
  - Ensured the simulator loads correctly using client:load.

- **Documentation**
  - Added a References section into the exhibit.
  - Included citations for external resources used in the information.

# Challenges Encountered

## Astro and React Integration

At first, we already set-up our own Astro Project since we didn't know that there was a template for the virtual exhibit so we needed to integrate that project into this template. Additionally, integrating a React application inside Astro MDX pages required understanding of Astro's client directives so we also needed to learn that. It was difficult for us to figure out how to properly integrate it, but we learned that using client:load allowed the simulator to run correctly after the page loaded.

## Styling Conflicts

One of the biggest challenges we faced was resolving the CSS conflicts between the Astro template and the simulator's Tailwind styles. It took us hours to debug and figure out what made these happen: 
- Background pattern disappearing
- Incorrect dark backgrounds
- Redundant CSS styling from our own css file and the global.css file
- Heading styles changing out of nowhere
- Layout alignment problems

We resolved them eventually by isolating the simulator's styles and preventing the project-specific CSS from overriding the template's global styles. 

## MDX Components

We experimented with creating an Astro InfoCard component for the other sections of our exhibit, but we eventually resorted to simply using the template's built-in markdown headings and lists because they integrated more properly with the exhibit. 

# Aha Moments / Things Learned

- Astro works well with React as Astro becomes the content framework while React handles the interactive components.
- We learned all about Astro components and how to use them more cleanly when we integrated it into our project.
- MDX allows Markdown and React components to be on the same page.
- Project CSS can unintentionally override the entire exhibit's design.
- Separating the simulator and visualizer logic from the exhibit content made debugging significantly easier.

# Creative Development

To make CPU cache memory concepts easier to understand for the viewers, we made an exhibit around the idea of showing how a memory request travels. Instead of just showing information, we made the simulator to demonstrate: 

- Address decomposition
- Cache indexing
- Cache hits and misses
- Memory access latency
- Cache state updates

This allows users to immediately observe how different memory accesses affect cache behavior.

# Current Status

## Completed
- Astro exhibit page
- React cache simulator
- Interactive cache visualization
- Address parsing
- Cache hit/miss simulation
- References section
- Disclosure on the use of AI/LLM section
- Table of Contents integration
- Responsive exhibit layout
- Styling fixes and compatibility with the exhibit template

## Things to be done
- Add additional explanatory text throughout the exhibit.
- Fix the styling for the Main Memory (RAM) section of the visualizer since as of now, it shows blurred text.
- Improve animations and overall design of the cache operations and the exhibit.
- Conduct a final code cleanup and refactoring.
- Proofread the exhibit content and verify all the references.
- Prepare the repository for the final submission and update the documentation.

# Initial Proposal README

# 📱 Virtual Exhibit Design

## Desktop Views

<p align="center">
  <img width="1090" alt="Desktop View 1" src="https://github.com/user-attachments/assets/c01a5f43-b57f-4ceb-8c19-b76b874f8e94" />
</p>

<p align="center">
  <img width="1087" alt="Desktop View 2" src="https://github.com/user-attachments/assets/3c3e3fa7-ef0a-4d06-8454-bb79edab9de7" />
</p>

## Mobile Views

<p align="center">
  <img width="220" alt="Mobile View 1" src="https://github.com/user-attachments/assets/542968fb-e0d6-475a-bfe2-6e3209fb6a65" />
  <img width="220" alt="Mobile View 2" src="https://github.com/user-attachments/assets/b3b1cfbb-2cb3-44f9-b50b-02c3adbfe648" />
  <img width="220" alt="Mobile View 3" src="https://github.com/user-attachments/assets/620f7a40-147c-4d91-971c-8ec8ec16622a" />
  <img width="220" alt="Mobile View 4" src="https://github.com/user-attachments/assets/404480bd-b70f-4c2a-9a64-1db789afc630" />
</p>

---

# 📝 Revisions Highlight (From Initial Submission)

To fully align with the project rubrics and feedback, our group made the following major revisions:

- **Refined Theme & Group Identity**
  - Changed the group name from **"CpU Later"** to **"Ca-Ching!"**
  - Narrowed the topic from the entire CPU architecture and Fetch-Decode-Execute cycle to **Cache Memory Mechanisms (Hits, Misses, and Locality)**.

- **Upgraded Interactive Element**
  - Replaced the calculator simulator with a **Dynamic CPU Cache Visualizer**.
  - Users input hexadecimal memory addresses, which are converted to binary and divided into **Tag**, **Index**, and **Offset** fields with animated visualization.

- **Modernized Tech Stack**
  - Added **ReactJS** and **Framer Motion** to the Astro framework for smooth real-time animations and interactions.

---

# I. The Core Concept: How Cache Memory Works

## 1. The Hardware Speed Gap and Cache Memory

### The Hardware Speed Gap

CPUs have become incredibly fast, while main memory (RAM) has remained comparatively slow. This creates a bottleneck where a fast processor constantly waits for data from slower RAM.

### Cache Memory

Cache memory is a small, ultra-fast memory located on or near the CPU. It bridges the speed gap by storing frequently accessed data, allowing the processor to retrieve information much faster.

> Cache memory typically operates **10–100× faster** than RAM and responds within only a few nanoseconds.

---

## 2. Cache Hits vs. Cache Misses

### Cache Hit

A cache hit occurs when the requested data is already stored in cache memory, allowing the CPU to retrieve it immediately.

### Cache Miss

A cache miss occurs when the requested data is not found in cache memory. The CPU must retrieve it from lower memory levels such as L2/L3 cache or RAM, increasing access time.

### How Cache Hits and Misses Work

1. **CPU requests data** — The processor first checks cache memory.
2. **Cache lookup** — If the requested data exists in cache, a *hit* occurs and the CPU immediately uses the data.
3. **Cache miss** — If the data is unavailable in cache, the CPU searches lower memory levels until the data is found.
4. **Cache update** — After retrieving the missing data, the CPU stores a copy in cache so future requests can be served faster.

---

## 3. Principle of Locality

The **Principle of Locality** describes the tendency of programs to repeatedly access the same data and instructions, or to access data located near recently accessed memory. Applying this principle in cache design significantly improves cache effectiveness. There are two main types:

### Temporal Locality

If a memory location is accessed, it is likely to be accessed again soon. For example, in the loop below, the variable `total` is accessed repeatedly across iterations — keeping it in cache enables faster access each time:

```c
for (int i = 0; i < 1000; i++) {
    sum += total;
}
```

### Spatial Locality

If a memory location is accessed, nearby memory locations are likely to be accessed soon as well. For example, the array traversal below accesses `arr[i]` sequentially — since array elements are stored contiguously in memory, loading one cache block often brings in nearby elements that will soon be needed:

```c
for (int i = 0; i < 1000; i++) {
    sum += arr[i];
}
```

---

# II. Tech Stack Plan

### Proposed Interactive Element: CPU Cache Visualizer

Users simulate a CPU data request by typing a hexadecimal memory address. The visualizer then performs and displays the following steps:

**Address Breakdown**

- Converts the hex address to binary.
- Slices the binary bits into Tag, Index, and Offset fields.
- Animates lines or particle streams from each bit field to its corresponding location in the cache hardware.

**Cache Hit Visualization**

- Checks the calculated row index, confirms the valid bit is active, and verifies the address tag matches the stored tag.
- The targeted cache cell glows, the offset bits isolate the data, and a fast light-colored stream shoots back to the CPU with low-latency statistics displayed.

**Cache Miss Visualization**

- If the row is empty or tags do not match, a miss icon flashes and a slow gray data stream crawls down to RAM.
- RAM fetches a full memory block (exploiting spatial locality), overwrites the cache row metadata, and sends data back to the CPU with high-latency statistics displayed.

### Technical Stack

To ensure seamless integration with the central virtual museum repository, the project strictly uses the following technologies:

| Layer          | Technology                                          |
| -------------- | --------------------------------------------------- |
| Core Framework | Node.js 26 + Astro 6 (via `astro.build` template) |
| Interactivity  | ReactJS components embedded in Astro `.mdx` pages |
| Styling        | TailwindCSS + ShadcnUI                              |
| Animations     | Framer Motion                                       |

Framer Motion handles complex visual transitions, including animated address calculations and data flow between the CPU, cache, and RAM.

---

# III. Style Guide

The exhibit uses a **Cyber-Physical Glassmorphism** design system built with Tailwind CSS and ShadcnUI, optimized for both desktop and mobile viewing.

| Element              | Specification                                             |
| -------------------- | --------------------------------------------------------- |
| Background           | Deep dark mode —`slate-950`                            |
| Cache Hit Indicator  | Vibrant green and cyan glowing borders                    |
| Cache Miss Indicator | Muted gray and amber tones                                |
| Typography           | Sans-serif (Inter or Geist) for high readability          |
| Desktop Layout       | Split-panel view — Simulator (left) / Visualizer (right) |
| Mobile Layout        | Single scrollable column via responsive grid              |

**Design Principles**

- High-contrast, glowing accents indicate data flow between the CPU and memory hierarchy.
- Clean educational typography is used for Exhibit Notes accordion sections.
- Responsive grid ensures the layout adapts gracefully across all screen sizes.

---

# IV. References

- *Cache Miss vs Cache Hit: What's the Difference?* (2023, May 10). WP Rocket. https://wp-rocket.me/wordpress-cache/cache-miss-vs-cache-hit/
- Lutkevich, B. (2024, June 25). *Cache Memory*. TechTarget. https://www.techtarget.com/searchstorage/definition/cache-memory
