# Image Generation & Visual Content Options for Portfolio Editor

## Executive Summary

This document outlines options for enabling users to create, generate, and source images, charts, and graphics for their portfolio case studies. We've researched AI image generation APIs, royalty-free image services, and chart generation tools.

## Recommended Approach: Multi-Tier Strategy

**Primary Recommendation**: Implement a combination of:
1. **Royalty-free image search** (Unsplash/Pexels) - For quick, professional photos
2. **AI image generation** (Google Imagen 3 via Gemini API) - For custom, on-demand visuals
3. **Chart generation** (Recharts/Chart.js) - For data visualization
4. **Future consideration**: User uploads with AI enhancement

---

## 1. AI Image Generation APIs

### Option A: Google Imagen 3 (via Gemini API) ⭐ **RECOMMENDED**

**Overview**: Google's latest image generation model, accessible through the Gemini API. Powered by Gemini 3 Pro and includes Nano Banana Pro capabilities.

**Key Features**:
- High-quality, artifact-free images
- Excellent text rendering (multilingual support)
- Context-enriched visuals (uses Google's knowledge base)
- Studio-quality editing capabilities
- Supports infographics and fact-based diagrams
- 2K and 4K resolution outputs
- SynthID watermarking (non-visible, for traceability)

**Pricing**: 
- **$0.03 per image** (very competitive)
- Pay-per-use model (no monthly minimums)

**API Access**:
- Available via Gemini API
- RESTful API with good documentation
- Supports aspect ratio control
- Multiple generation options per prompt

**Integration**:
```typescript
// Example API call structure
POST https://generativelanguage.googleapis.com/v1beta/models/imagen-3-generate-001:generateImages
{
  "prompt": "A modern product management dashboard with charts and metrics",
  "numberOfImages": 1,
  "aspectRatio": "16:9",
  "safetyFilterLevel": "block_some"
}
```

**Pros**:
- ✅ Best price point ($0.03/image)
- ✅ Excellent text rendering (great for infographics)
- ✅ Context-aware generation
- ✅ High-quality outputs
- ✅ Good for case study visuals
- ✅ Reliable Google infrastructure

**Cons**:
- ⚠️ Requires Google Cloud account setup
- ⚠️ API is relatively new (less community examples)

**Best For**: Custom visuals, infographics, diagrams, case study mockups

---

### Option B: OpenAI DALL-E 3

**Overview**: OpenAI's advanced image generation model, known for high-quality outputs and good prompt understanding.

**Key Features**:
- High-quality image generation
- Good prompt adherence
- Multiple size options
- Safety filters built-in

**Pricing**:
- **$0.040 per image** (1024x1024)
- **$0.080 per image** (1024x1792 or 1792x1024)
- Slightly more expensive than Imagen 3

**API Access**:
- Well-documented REST API
- Good developer experience
- Active community support

**Pros**:
- ✅ Excellent image quality
- ✅ Well-established API
- ✅ Good documentation
- ✅ Strong community support

**Cons**:
- ⚠️ More expensive than Imagen 3
- ⚠️ Text rendering not as strong as Imagen 3
- ⚠️ Less suited for infographics

**Best For**: General image generation, artistic visuals

---

### Option C: Midjourney

**Overview**: High-quality AI image generation, known for artistic and photorealistic outputs.

**Key Features**:
- Exceptional image quality
- Strong artistic capabilities
- Multiple style options

**Pricing**:
- Subscription-based ($10-$60/month)
- Not ideal for per-user usage

**API Access**:
- ❌ **No official API** (Discord bot only)
- Not suitable for programmatic integration

**Verdict**: **Not recommended** - No API access makes integration impossible.

---

### Option D: Stable Diffusion (Open Source)

**Overview**: Open-source image generation models that can be self-hosted or accessed via APIs.

**Key Features**:
- Open-source and customizable
- Multiple model variants
- Can be self-hosted

**Options**:
1. **Stability AI API**: Official API service
   - Pricing: ~$0.04 per image
   - Good quality, but less polished than Imagen 3/DALL-E
2. **Self-hosted**: Run your own instance
   - Requires GPU infrastructure
   - More control, but higher operational costs

**Pros**:
- ✅ Open-source flexibility
- ✅ Can be self-hosted
- ✅ Good community

**Cons**:
- ⚠️ Requires more technical setup
- ⚠️ Quality varies by model
- ⚠️ Self-hosting requires GPU infrastructure

**Best For**: Custom implementations, specific use cases

---

## 2. Royalty-Free Image Services

### Option A: Unsplash API ⭐ **RECOMMENDED**

**Overview**: High-quality, free-to-use photos with a simple API.

**Key Features**:
- 3+ million high-quality photos
- Free for commercial use
- Simple REST API
- Good search functionality
- No attribution required (though appreciated)

**Pricing**:
- **Free tier**: 50 requests/hour
- **Plus tier**: $9/month for 5,000 requests/hour
- Very affordable for most use cases

**API Access**:
```typescript
// Example search
GET https://api.unsplash.com/search/photos?query=product+management&client_id=YOUR_KEY
```

**Integration**:
- Easy React integration
- Good TypeScript support
- Can download images directly or proxy through your server

**Pros**:
- ✅ Free tier available
- ✅ High-quality photos
- ✅ Easy integration
- ✅ Great for hero images, backgrounds

**Cons**:
- ⚠️ Limited to existing photos (not custom generation)
- ⚠️ May not find exact matches for specific needs

**Best For**: Hero images, backgrounds, general photography needs

---

### Option B: Pexels API

**Overview**: Another excellent free stock photo service.

**Key Features**:
- 3+ million free photos
- Free for commercial use
- Good API documentation
- Video content also available

**Pricing**:
- **Free**: 200 requests/hour
- **Plus**: $9.99/month for higher limits

**Pros**:
- ✅ Generous free tier
- ✅ Good quality photos
- ✅ Video content available

**Cons**:
- ⚠️ Similar limitations to Unsplash

**Best For**: Alternative to Unsplash, video content needs

---

## 3. Chart & Graphics Generation

### Option A: Recharts (React) ⭐ **RECOMMENDED**

**Overview**: Composable charting library built on React components.

**Key Features**:
- Built specifically for React
- Declarative API
- Responsive by default
- Export to SVG/PNG
- Good TypeScript support

**Pricing**: **Free** (MIT License)

**Usage**:
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<LineChart data={data}>
  <Line type="monotone" dataKey="value" stroke="#8884d8" />
  <XAxis dataKey="name" />
  <YAxis />
</LineChart>
```

**Pros**:
- ✅ Free and open-source
- ✅ React-native (fits your stack)
- ✅ Easy to customize
- ✅ Can export to images
- ✅ Good documentation

**Cons**:
- ⚠️ Requires user to provide data
- ⚠️ Limited to chart types (not general graphics)

**Best For**: Data visualization, metrics charts, case study metrics

---

### Option B: Chart.js with react-chartjs-2

**Overview**: Popular charting library with React wrapper.

**Key Features**:
- Extensive chart types
- Highly customizable
- Can export to images
- Good performance

**Pricing**: **Free** (MIT License)

**Pros**:
- ✅ More chart types than Recharts
- ✅ Very customizable
- ✅ Good performance

**Cons**:
- ⚠️ Slightly more complex API
- ⚠️ Requires more configuration

**Best For**: Complex charting needs, advanced visualizations

---

### Option C: Programmatic Graphics (SVG/Canvas)

**Overview**: Generate custom graphics using SVG or Canvas APIs.

**Key Features**:
- Complete control
- Can create any visual
- No external dependencies

**Implementation**:
- Use React to generate SVG components
- Or use Canvas API for more complex graphics
- Can export to PNG/SVG

**Pros**:
- ✅ Complete flexibility
- ✅ No external dependencies
- ✅ Can create custom visuals

**Cons**:
- ⚠️ Requires more development time
- ⚠️ More complex to implement

**Best For**: Custom graphics, unique visualizations

---

## 4. Implementation Recommendations

### Phase 1: Quick Wins (Immediate Implementation)

1. **Unsplash Integration**
   - Add image search to portfolio editor
   - Allow users to search and select photos
   - Store selected image URLs
   - **Effort**: Low (1-2 days)
   - **Cost**: Free tier sufficient initially

2. **Recharts for Metrics**
   - Add chart component for case study metrics
   - Allow users to visualize their data
   - Export charts as images
   - **Effort**: Low (2-3 days)
   - **Cost**: Free

### Phase 2: AI Generation (Short-term)

3. **Google Imagen 3 Integration**
   - Add "Generate Image" button in editor
   - Allow users to describe desired image
   - Generate and insert into case study
   - **Effort**: Medium (3-5 days)
   - **Cost**: $0.03/image (very affordable)

**Implementation Plan**:
```typescript
// Create API route: app/api/images/generate/route.ts
// Handle image generation server-side
// Store generated images (or use URLs if provided)
// Return image URL to frontend
```

### Phase 3: Enhanced Features (Future)

4. **Image Upload with AI Enhancement**
   - Allow users to upload their own images
   - Offer AI enhancement/editing options
   - Use Imagen 3 editing capabilities

5. **Advanced Chart Generation**
   - AI-powered chart suggestions
   - Automatic data visualization
   - Custom infographic generation

---

## 5. Cost Analysis

### Scenario: 1,000 active users/month

**Unsplash**:
- Free tier: 50 requests/hour = ~36,000 requests/day
- **Cost**: $0/month (free tier sufficient)

**Imagen 3**:
- Assume 2 images per user per month = 2,000 images
- **Cost**: 2,000 × $0.03 = **$60/month**

**Total Estimated Cost**: **~$60/month** for 1,000 active users

**Scaling**:
- 10,000 users: ~$600/month
- 100,000 users: ~$6,000/month

**Note**: Costs scale linearly with usage, which is predictable and manageable.

---

## 6. Technical Integration Considerations

### Security & Rate Limiting

1. **API Key Management**
   - Store API keys in environment variables
   - Never expose keys to frontend
   - Use Next.js API routes as proxy

2. **Rate Limiting**
   - Implement per-user rate limits
   - Prevent abuse
   - Consider subscription tiers for higher limits

3. **Content Moderation**
   - All APIs include safety filters
   - Consider additional moderation for user-generated prompts
   - Log generated content for audit

### Image Storage

**Options**:
1. **Store URLs only** (if API provides persistent URLs)
   - Pros: No storage costs
   - Cons: Dependent on external service

2. **Download and store** (Supabase Storage/S3)
   - Pros: Full control, permanent
   - Cons: Storage costs

**Recommendation**: Start with URL storage, migrate to download if needed.

### User Experience

1. **Loading States**: Show progress during generation
2. **Error Handling**: Graceful fallbacks
3. **Preview**: Show generated images before inserting
4. **Regeneration**: Allow users to regenerate if not satisfied
5. **History**: Save generated images for reuse

---

## 7. Comparison Matrix

| Feature | Imagen 3 | DALL-E 3 | Unsplash | Recharts |
|---------|----------|----------|----------|----------|
| **Cost per image** | $0.03 | $0.04-0.08 | Free | Free |
| **Custom generation** | ✅ | ✅ | ❌ | ❌ |
| **Text rendering** | ✅ Excellent | ⚠️ Good | N/A | N/A |
| **Infographics** | ✅ Excellent | ⚠️ Limited | ❌ | ✅ Charts only |
| **API availability** | ✅ | ✅ | ✅ | N/A (library) |
| **Setup complexity** | Medium | Low | Low | Low |
| **Best for** | Custom visuals | General images | Stock photos | Data charts |

---

## 8. Final Recommendations

### Immediate Implementation (Week 1-2)
1. ✅ **Unsplash API** - Quick image search integration
2. ✅ **Recharts** - Chart generation for metrics

### Short-term (Month 1)
3. ✅ **Google Imagen 3** - AI image generation
   - Best price/quality ratio
   - Excellent for case study visuals
   - Good text rendering for infographics

### Future Considerations
4. User image uploads
5. AI-powered image editing
6. Advanced infographic generation
7. Video content (Pexels)

---

## 9. Next Steps

1. **Set up Google Cloud account** (for Imagen 3 API)
2. **Get Unsplash API key** (free tier)
3. **Create API route structure**:
   - `/api/images/search` (Unsplash)
   - `/api/images/generate` (Imagen 3)
   - `/api/images/chart` (Recharts export)
4. **Build UI components**:
   - Image search modal
   - Image generation form
   - Chart editor
5. **Integrate into PortfolioEditor**

---

## 10. Resources

- **Google Imagen 3 API**: https://ai.google.dev/gemini-api/docs/image-generation
- **Unsplash API**: https://unsplash.com/developers
- **Recharts**: https://recharts.org/
- **DALL-E 3 API**: https://platform.openai.com/docs/guides/images

---

## Questions to Consider

1. **Storage**: Do we store generated images or just URLs?
2. **Rate Limits**: What limits per user/subscription tier?
3. **Moderation**: How strict should content filtering be?
4. **Attribution**: Do we require attribution for Unsplash images?
5. **Export**: Can users export portfolios with generated images?

---

*Last Updated: January 2025*
*Research conducted for Product Careerlyst portfolio editor feature*





