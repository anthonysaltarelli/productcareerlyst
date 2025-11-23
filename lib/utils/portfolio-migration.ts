import { PageContent, ContentBlock } from '@/lib/types/portfolio-content';
import { createContentBlock } from './content-blocks';

// Legacy PortfolioItem interface (for migration)
interface LegacyPortfolioItem {
  id: string;
  title: string;
  description: string;
  heroImage: string;
  tags: string[];
  order: number;
  problemDiscover?: string;
  problemDefine?: string;
  solutionDevelop?: string;
  solutionDeliver?: string;
  process?: string;
  metrics?: Array<{ id: string; label: string; value: string }>;
  outcomes?: string;
  images?: string[];
}

// Migrate legacy PortfolioItem to new PageContent with content blocks
export const migrateLegacyItemToPageContent = (item: LegacyPortfolioItem): PageContent => {
  const blocks: ContentBlock[] = [];
  let order = 0;

  // Hero Image Block
  if (item.heroImage) {
    blocks.push(createContentBlock('hero-image', order++, { images: [item.heroImage] }));
  }

  // Title and Description Block
  blocks.push(
    createContentBlock('title-description', order++, {
      title: item.title,
      description: item.description,
    })
  );

  // Problem Section
  if (item.problemDiscover || item.problemDefine) {
    blocks.push(createContentBlock('section-header', order++, { title: 'Problem' }));
    
    if (item.problemDiscover) {
      blocks.push(
        createContentBlock('section-header', order++, { title: 'Discover', spacing: 'tight' })
      );
      blocks.push(createContentBlock('text', order++, { text: item.problemDiscover }));
    }
    
    if (item.problemDefine) {
      blocks.push(
        createContentBlock('section-header', order++, { title: 'Define', spacing: 'tight' })
      );
      blocks.push(createContentBlock('text', order++, { text: item.problemDefine }));
    }
  }

  // Solution Section
  if (item.solutionDevelop || item.solutionDeliver) {
    blocks.push(createContentBlock('section-header', order++, { title: 'Solution' }));
    
    if (item.solutionDevelop) {
      blocks.push(
        createContentBlock('section-header', order++, { title: 'Develop', spacing: 'tight' })
      );
      blocks.push(createContentBlock('text', order++, { text: item.solutionDevelop }));
    }
    
    if (item.solutionDeliver) {
      blocks.push(
        createContentBlock('section-header', order++, { title: 'Deliver', spacing: 'tight' })
      );
      blocks.push(createContentBlock('text', order++, { text: item.solutionDeliver }));
    }
  }

  // Process Section
  if (item.process) {
    blocks.push(createContentBlock('section-header', order++, { title: 'Process' }));
    blocks.push(createContentBlock('text', order++, { text: item.process }));
  }

  // Results Section
  if (item.metrics && item.metrics.length > 0 || item.outcomes) {
    blocks.push(createContentBlock('section-header', order++, { title: 'Results' }));
    
    if (item.metrics && item.metrics.length > 0) {
      blocks.push(createContentBlock('metrics-grid', order++, { metrics: item.metrics }));
    }
    
    if (item.outcomes) {
      blocks.push(createContentBlock('text', order++, { text: item.outcomes }));
    }
  }

  // Image Gallery
  if (item.images && item.images.length > 0) {
    blocks.push(createContentBlock('section-header', order++, { title: 'Gallery' }));
    blocks.push(createContentBlock('gallery', order++, { images: item.images, galleryColumns: 2 }));
  }

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    heroImage: item.heroImage,
    tags: item.tags || [],
    order: item.order,
    contentBlocks: blocks,
  };
};

