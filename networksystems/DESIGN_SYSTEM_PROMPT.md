# MIAR Platform Design System - UI/UX Replication Prompt

## **Overview**
Create a sophisticated, enterprise-grade platform for Mining Intelligence & African Research (MIAR) with a premium Swiss-inspired design aesthetic that conveys trust, precision, and advanced analytics capabilities.

## **Design Philosophy**
- **Swiss Minimalism**: Clean, precise, functional design with strategic use of whitespace
- **Premium Enterprise**: High-end B2B SaaS aesthetic targeting executive decision-makers
- **Sophisticated Neutrals**: Zinc/gray color palette with strategic color accents
- **Glassmorphism**: Subtle backdrop blur effects and translucent layers
- **Professional Credibility**: Design that inspires confidence in complex mining/financial data

## **Color Palette**

### **Primary Colors**
```css
/* Brand Colors */
--brand-primary: #059669 (emerald-600)  /* Primary actions, mining theme */
--brand-dark: #18181b (zinc-900)        /* Logo, headers, emphasis */

/* Neutral Base */
--neutral-50: #fafafa (zinc-50)         /* Light backgrounds */
--neutral-100: #f4f4f5 (zinc-100)      /* Subtle backgrounds */
--neutral-200: #e4e4e7 (zinc-200)      /* Borders, dividers */
--neutral-300: #d4d4d8 (zinc-300)      /* Disabled states */
--neutral-500: #71717a (zinc-500)      /* Secondary text */
--neutral-600: #52525b (zinc-600)      /* Primary text */
--neutral-900: #18181b (zinc-900)      /* Headlines, emphasis */

/* Functional Colors */
--success: #059669 (emerald-600)       /* Success states */
--info: #3b82f6 (blue-500)            /* Information, portfolio */
--warning: #f59e0b (amber-500)        /* Warnings */
--error: #ef4444 (red-500)            /* Errors */
--cyan: #06b6d4 (cyan-500)            /* Trade networks */
```

### **Gradient Backgrounds**
```css
/* Primary gradient for full-page backgrounds */
background: linear-gradient(to bottom right, #fafafa, #f4f4f5) /* from-zinc-50 to-zinc-100 */

/* Glassmorphism overlays */
background: rgba(255, 255, 255, 0.95) /* bg-white/95 */
backdrop-filter: blur(12px) /* backdrop-blur-md */
```

## **Typography**

### **Font System**
- **Primary**: Inter (system font stack)
- **Weights**:
  - `font-extralight` (200) - Headlines, brand elements
  - `font-light` (300) - Body text, descriptions
  - `font-normal` (400) - Standard text
  - `font-medium` (500) - Emphasis
  - `font-semibold` (600) - Subheadings

### **Typography Scale**
```css
/* Headlines */
.headline-large: text-3xl font-extralight tracking-tight (48px)
.headline-medium: text-2xl font-extralight tracking-wide (32px)
.headline-small: text-xl font-extralight tracking-wide (24px)

/* Body Text */
.body-large: text-lg font-light (18px)
.body-medium: text-base font-light (16px)
.body-small: text-sm font-light (14px)

/* UI Elements */
.label-medium: text-sm font-light (14px)
.label-small: text-xs font-light (12px)
```

## **Component Architecture**

### **1. Navigation & Headers**

#### **Main Header (Landing Page)**
```css
header: bg-white/95 backdrop-blur-md border-b border-zinc-200/50
container: max-w-7xl mx-auto px-6 py-4
brand: bg-zinc-900 text-white px-4 py-2 text-sm font-light tracking-wide rounded
tagline: text-lg font-extralight text-zinc-900
```

#### **Platform Header (Dashboard)**
```css
nav: bg-white/95 backdrop-blur-md border-b border-zinc-200/50 sticky top-0 z-50
container: max-w-[1800px] px-12 h-16
brand: text-xl font-extralight text-zinc-900 tracking-wide
```

#### **Tab Navigation (Platform)**
```css
container: bg-white/60 backdrop-blur-sm rounded-full p-1 border border-zinc-200/50
active-tab: bg-emerald-500 text-white shadow-sm (mining)
           bg-blue-500 text-white shadow-sm (investment)
           bg-cyan-500 text-white shadow-sm (trade)
inactive-tab: text-zinc-600 hover:text-zinc-900 hover:bg-white/50
size: px-4 py-2 rounded-full text-sm font-light
```

### **2. Forms & Input Elements**

#### **Form Containers**
```css
form-bg: bg-white/95 backdrop-blur-sm rounded-2xl p-8
card-bg: bg-white/80 backdrop-blur-sm border-zinc-200/50 shadow-xl
```

#### **Input Fields**
```css
input: w-full px-4 py-3 border border-zinc-200 rounded-lg
       focus:ring-2 focus:ring-emerald-500 focus:border-transparent
label: block text-sm font-light text-zinc-700 mb-2
```

#### **Buttons**

**Primary Buttons**
```css
primary: bg-emerald-600 text-white py-4 rounded-lg font-light text-lg
         hover:bg-emerald-700 transition-colors
         inline-flex items-center justify-center space-x-2

loading: bg-zinc-400 cursor-not-allowed (disabled state)
```

**Secondary Buttons**
```css
secondary: border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400
          bg-white/60 backdrop-blur-sm h-10 w-10 p-0 (icon buttons)
```

### **3. Layout Patterns**

#### **Full-Screen Layouts**
```css
container: min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100
content: max-w-[1800px] mx-auto px-6 py-8
```

#### **Content Sections**
```css
section: py-20 (large sections)
section: py-12 (medium sections)
container: max-w-7xl mx-auto px-6
```

#### **Grid Systems**
```css
cards: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
form: grid grid-cols-1 gap-6
metrics: grid grid-cols-3 gap-4
```

### **4. Card Components**

#### **Feature Cards**
```css
card: bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-zinc-200/50
hover: hover:bg-white/80 transition-all
icon: w-12 h-12 text-emerald-600 mb-6
title: text-xl font-light text-zinc-900 mb-4
description: text-zinc-600 font-light leading-relaxed
```

#### **Metric Cards**
```css
card: text-center p-4 bg-gray-50 rounded
value: text-2xl font-bold text-blue-600 (varies by type)
label: text-sm text-gray-600
```

### **5. Interactive Elements**

#### **Loading States**
```css
spinner: animate-spin rounded-full h-5 w-5 border-b-2 border-white
container: flex items-center justify-center space-x-2
```

#### **Status Indicators**
```css
success: bg-emerald-50 border border-emerald-200 text-emerald-700
error: bg-rose-50 border border-rose-200 text-rose-700
info: bg-blue-50 border border-blue-200 text-blue-700
```

## **Interaction Patterns**

### **Hover Effects**
- Subtle color transitions (`transition-colors`)
- Backdrop blur changes (`bg-white/60 → bg-white/80`)
- Text color shifts (`text-zinc-600 → text-zinc-900`)

### **Focus States**
- Ring focus: `focus:ring-2 focus:ring-emerald-500 focus:border-transparent`
- Consistent emerald accent for focused elements

### **Transitions**
- Standard: `transition-all` or `transition-colors`
- Smooth scrolling: `scroll-smooth`
- Transform effects for micro-interactions

## **Content Strategy**

### **Brand Voice**
- **Professional & Authoritative**: "Strategic mining intelligence"
- **Precise & Technical**: "Advanced network analysis algorithms"
- **Results-Oriented**: "ROI projections for identified opportunities"
- **African-Focused**: "African mining operations," "West African Mining Corp"

### **Copy Patterns**
- Headlines: Action-oriented, benefit-focused
- Descriptions: Technical but accessible
- CTAs: Professional urgency ("Schedule Strategic Briefing")
- Form labels: Clear, concise business language

## **Responsive Design**

### **Breakpoints**
```css
sm: 640px (mobile)
md: 768px (tablet)
lg: 1024px (desktop)
xl: 1280px (large desktop)
2xl: 1536px (ultra-wide)
```

### **Mobile Adaptations**
- Reduce padding: `px-4 sm:px-6 lg:px-8`
- Stack navigation elements
- Simplify backdrop effects
- Maintain professional aesthetic

## **Accessibility Standards**

### **Color Contrast**
- Text on zinc-50 background: minimum 4.5:1 ratio
- Interactive elements: clear focus indicators
- Error states: sufficient contrast for readability

### **Interactive Elements**
- Keyboard navigation support
- Screen reader friendly labels
- Loading state announcements
- Form validation feedback

## **Implementation Notes**

### **Framework**: Next.js 14+ with Tailwind CSS
### **Icons**: Lucide React (consistent stroke weight)
### **State Management**: React hooks for form/UI state
### **Deployment**: Vercel (optimized builds)

### **Key Dependencies**
```json
{
  "next": "14.2.5",
  "react": "18+",
  "tailwindcss": "3+",
  "lucide-react": "latest"
}
```

## **Usage Instructions**

1. **Start with the color palette** - Establish zinc-based neutrals with emerald accents
2. **Apply typography hierarchy** - Use font-light as default, extralight for headlines
3. **Layer glassmorphism effects** - Backdrop blur + white/transparency overlays
4. **Implement consistent spacing** - 8px grid system (p-2, p-4, p-6, p-8, etc.)
5. **Add subtle interactions** - Hover states, focus rings, loading spinners
6. **Maintain professional tone** - Swiss precision meets African mining intelligence

This design system creates a sophisticated, trustworthy platform that appeals to enterprise mining executives while maintaining excellent usability and modern web standards.