-- Seed Data for Learning Platform

-- Insert Categories
INSERT INTO categories (name, description, slug, display_order) VALUES
('Career Preparation', 'Essential skills for advancing your PM career', 'career-preparation', 1),
('Interview Mastery', 'Master the PM interview process', 'interview-mastery', 2),
('Product Fundamentals', 'Core concepts and skills for Product Managers', 'product-fundamentals', 3),
('Compensation', 'Maximize your earning potential', 'compensation', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert Courses
WITH category_ids AS (
  SELECT id, slug FROM categories
)
INSERT INTO courses (title, slug, description, length, prioritization, category_id, is_published) VALUES
(
  'Resume & LinkedIn',
  'resume-linkedin',
  'Update your Resume and LinkedIn to increase your chances of landing an interview.',
  '2 hours',
  1,
  (SELECT id FROM category_ids WHERE slug = 'career-preparation'),
  true
),
(
  'Launch a Product Portfolio',
  'launch-product-portfolio',
  'Stand out from the sea of other candidates by making a standout product portfolio.',
  '3 hours',
  2,
  (SELECT id FROM category_ids WHERE slug = 'career-preparation'),
  true
),
(
  'Secure a Referral',
  'secure-referral',
  '85% of offers are given to people who were referred internally.',
  '45 minutes',
  3,
  (SELECT id FROM category_ids WHERE slug = 'career-preparation'),
  true
),
(
  'Company Prep & Applying',
  'company-prep-applying',
  'Increase your chances of landing an interview when you apply for roles.',
  '40 minutes',
  4,
  (SELECT id FROM category_ids WHERE slug = 'career-preparation'),
  true
),
(
  'Nail the PM Interviews',
  'nail-pm-interviews',
  'Learn how to excel at all types of Product Management interviews.',
  '3 hours',
  5,
  (SELECT id FROM category_ids WHERE slug = 'interview-mastery'),
  true
),
(
  'PM Offer Negotiation',
  'pm-offer-negotiation',
  'Increase your total compensation once you land an offer.',
  '45 minutes',
  6,
  (SELECT id FROM category_ids WHERE slug = 'compensation'),
  true
),
(
  'Product Management Fundamentals',
  'product-management-fundamentals',
  'Learn the fundamentals of Product Management. Everything between user experience design, engineering, research, strategy, and more.',
  '10 hours',
  7,
  (SELECT id FROM category_ids WHERE slug = 'product-fundamentals'),
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Insert Lessons for Resume & LinkedIn
WITH course_id AS (SELECT id FROM courses WHERE slug = 'resume-linkedin')
INSERT INTO lessons (course_id, title, video_url, prioritization, requires_subscription) VALUES
((SELECT id FROM course_id), 'Introduction', '79273cdab48f4443a7ddf51cf0fc00d5', '1', false),
((SELECT id FROM course_id), 'Where Resume & LinkedIn optimization fit in the path to landing a PM offer', '0c5f5e5c552e41ec9e14e560d68bdb97', '2', false),
((SELECT id FROM course_id), 'Understanding the goal of Product Management hiring', '2bd32da067784a4691d0a98457fcb4d1', '3', false),
((SELECT id FROM course_id), 'How hiring Product Managers works behind the scenes', '5337058bb0334578a74f9a610eb52bb6', '4', false),
((SELECT id FROM course_id), 'Understanding what PM roles to target: 4 Vector Fit', 'd87b88107a574f4fabba4d03fa98aa4e', '5', false),
((SELECT id FROM course_id), 'How big companies differ from small companies for PMs', 'ebb0d26b8c50458c9fcf176ea4e61284', '6', false),
((SELECT id FROM course_id), 'Turn your background into a strong PM career strategy', 'df0051cf499644ccbb78741797a3b051', '7', false),
((SELECT id FROM course_id), 'What recruiters are looking for in Product Manager candidates', '7bd657835e3949a8985c903590a0ae49', '8', false),
((SELECT id FROM course_id), 'How to customize your LinkedIn profile to build authority', '316bf5037afc482db02c0feed753b992', '9', true),
((SELECT id FROM course_id), 'How to write powerful resume bullets', 'dee20cf1b7f1466aabbc9c6f1ba43bcc', '10', true),
((SELECT id FROM course_id), 'How to format your PM resume', 'd6a4b97c2bd64df4b3293d5bbc536a58', '11', true),
((SELECT id FROM course_id), 'Using the PM Resume Template + Example PM Resume', 'a13d9f1037504b5aafdf6aea0d5e45d2', '12', true),
((SELECT id FROM course_id), 'How to tailor your PM resume for specific roles', '9132fde49a5543ff812dfce0e3579487', '13', true);

-- Insert Lessons for Launch a Product Portfolio
WITH course_id AS (SELECT id FROM courses WHERE slug = 'launch-product-portfolio')
INSERT INTO lessons (course_id, title, video_url, prioritization, requires_subscription) VALUES
((SELECT id FROM course_id), 'What is a portfolio & why do you need it?', 'cd0c4a7926774d7db4c4c7b0a6168224', '1', false),
((SELECT id FROM course_id), 'Parts of a Case Study', '3a66b5086da747bfaf2f65601f8a3da4', '2', false),
((SELECT id FROM course_id), 'Picking a Product / Problem', 'f43562bfd8074fd1948978d38cb41c4a', '3', false),
((SELECT id FROM course_id), 'Case Study Part 1: Problem - Discover', '564471e164954969901597570a4cf2f4', '4', false),
((SELECT id FROM course_id), 'Case Study Part 2: Problem - Definition', 'b753b5e87a7648a9bced7223a08ff886', '5', true),
((SELECT id FROM course_id), 'Case Study Part 3: Solution - Develop', '3c20a4037b3c4ba19f38f36b29d90248', '6', true),
((SELECT id FROM course_id), 'Case Study Part 4: Solution - Deliver', '3f269cebd260417c812ab2f1bd5c3ff7', '7', true),
((SELECT id FROM course_id), 'About Me', '93ba290aac574094807c4d585f3ff8b2', '8', true),
((SELECT id FROM course_id), 'Work', 'f65a3399c20b49438bce8f1456b0b206', '9', true),
((SELECT id FROM course_id), 'Side Projects', '36d9bd161adb4497989a4f2c2616ee9d', '10', true),
((SELECT id FROM course_id), 'Contact', 'a91405ac09c845f6a0407af1141c02a9', '11', true),
((SELECT id FROM course_id), 'Putting it All Together', '785774349b14430588a326a3d024002d', '12', true),
((SELECT id FROM course_id), 'Using your Portfolio to stand out', 'fcdf16f50e03404192de4e126d9dc664', '13', true),
((SELECT id FROM course_id), 'Figma 101 for creating graphics', 'd0337ecb86454ef3a9a0d7c2abf47c23', '14', true),
((SELECT id FROM course_id), 'Case Example: Uber Eats', '6059fb9aed5c43edb67a12f0f2e8fa9c', '15', false),
((SELECT id FROM course_id), 'Case Example: PayPal', 'a9efd91fdd25478f99a1becde7060275', '16', false);

-- Insert Lessons for Secure a Referral
WITH course_id AS (SELECT id FROM courses WHERE slug = 'secure-referral')
INSERT INTO lessons (course_id, title, video_url, prioritization, requires_subscription) VALUES
((SELECT id FROM course_id), 'Importance of Networking', '13d5a634387b44a6b44448272e16ea86', '1', false),
((SELECT id FROM course_id), 'What to say when reaching out', '7422302ccd4a4fedbd262eeb424fc543', '2', true),
((SELECT id FROM course_id), 'What to say on the call', '9036f0fe2642444f954dc67390708f54', '3', true),
((SELECT id FROM course_id), 'How to win your contact over', 'd18ead41805f41b0bc61ac490eac8833', '4', true),
((SELECT id FROM course_id), 'Communicating to your network', '2628154f54f94865a60a7871942424fe', '5', true);

-- Insert Lessons for Company Prep & Applying
WITH course_id AS (SELECT id FROM courses WHERE slug = 'company-prep-applying')
INSERT INTO lessons (course_id, title, video_url, prioritization, requires_subscription) VALUES
((SELECT id FROM course_id), 'Finding the right jobs to apply to', '0fff0b49a99445b3b48bd03b310919e5', '1', false),
((SELECT id FROM course_id), 'Standing out in the application process', '37642fc608724b8ab1b58b9f9822c082', '2', true),
((SELECT id FROM course_id), 'How to Apply', 'd23e78ded063423eb35536b284b3f13b', '3', true),
((SELECT id FROM course_id), 'Staying motivated during your search', '080c8051412548dda28152d56c47ce36', '4', true);

-- Insert Lessons for Nail the PM Interviews
WITH course_id AS (SELECT id FROM courses WHERE slug = 'nail-pm-interviews')
INSERT INTO lessons (course_id, title, video_url, prioritization, requires_subscription) VALUES
((SELECT id FROM course_id), 'Welcome to the PM Interview Course', '79819c76b5b7481785ac78e83a061bdf', '1', false),
((SELECT id FROM course_id), 'Types of PM Interview Questions', 'e6e2e9e890ba4a22abb44017f1c4414d', '2', false),
((SELECT id FROM course_id), 'What are PM interviewers looking for?', 'ec0715d430b14c66946067321ec2555f', '3', true),
((SELECT id FROM course_id), 'Interview Grading Rubrics', 'd76401b01b66419da3d0253f8e14d5b8', '4', true),
((SELECT id FROM course_id), 'Preparing For Your Interview', '0a711c4bde534ad5936cc351b8f96aee', '5', true),
((SELECT id FROM course_id), 'Interview Tips & Tricks', 'b45c706efab646f6b66759e18e12c7db', '6', true),
((SELECT id FROM course_id), 'Framework: Loop Method', '154165cb511c4447879178f344469ad1', '7', true),
((SELECT id FROM course_id), 'Framework: Diamond Method', '2dc20a8c8303450ca1a728353d15044c', '8', true),
((SELECT id FROM course_id), 'Framework: Listicle Method', '00cc14f718e34a3194e9549303442977', '9', true),
((SELECT id FROM course_id), 'How to Pause & Brainstorm', '64968478e5204836ab68d77dd4e53f2e', '10', true),
((SELECT id FROM course_id), 'How to Ask Clarifying Questions', '879928c1612844738eea4a77c2aeb68f', '11', true),
((SELECT id FROM course_id), 'Tell Me About Yourself Framework', '3d7e1b2bc4ff4aaa81a89f070292640a', '12', true),
((SELECT id FROM course_id), 'Tell Me About Yourself Example', '57e2aa24c2e240dea182050c63730770', '13', true),
((SELECT id FROM course_id), 'Behavioral Framework & Prep', '312ed3c78e554e2d922e0edd9327e36d', '14', true),
((SELECT id FROM course_id), 'Behavioral Example', '652e368b8c7e45289f62e9969b8cdf8a', '15', true),
((SELECT id FROM course_id), 'Product Design / Product Sense', 'dd5c14f4a246493d95e209538b2c9bf0', '16', true),
((SELECT id FROM course_id), 'Technical', 'daa0f9d10bfc4ba5881465ab4ae2aba2', '17', true),
((SELECT id FROM course_id), 'Analytics / Execution', '68381563165e4c4aa25e6a829f3384fb', '18', true),
((SELECT id FROM course_id), 'Product Strategy', '95cc0d73f12f4fae832269d04501b581', '19', true),
((SELECT id FROM course_id), 'Take Home / Case Study', '4de347482feb477fa4e6eb9757c1e3bc', '20', true);

-- Insert Lessons for PM Offer Negotiation
WITH course_id AS (SELECT id FROM courses WHERE slug = 'pm-offer-negotiation')
INSERT INTO lessons (course_id, title, video_url, prioritization, requires_subscription) VALUES
((SELECT id FROM course_id), 'Understanding your offer', 'f1258be6bd8f41be9c4416a0e09fe804', '1', true),
((SELECT id FROM course_id), 'Researching the market', '6fb3247616eb4072bd24b3bffd6cc443', '2', true),
((SELECT id FROM course_id), 'Making the ask', '53aa8c213a504fe9abc6611e3f5b8561', '3', true),
((SELECT id FROM course_id), 'Tips during Negotiations', '6f18b838bf824ec5a46e5059ff346c39', '4', true);

-- Insert Lessons for Product Management Fundamentals
WITH course_id AS (SELECT id FROM courses WHERE slug = 'product-management-fundamentals')
INSERT INTO lessons (course_id, title, video_url, prioritization, requires_subscription) VALUES
((SELECT id FROM course_id), 'Role & Responsibilities of a PM', 'd03c8d698f604af1bb37f535aa6c59df', '1.1', false),
((SELECT id FROM course_id), 'Importance of PMs in Organizations', '5308f1a1ed9747faa6b7099b1a5f9b00', '1.2', false),
((SELECT id FROM course_id), 'Product manager vs. Project Manager', '3a1aa1f6a9c24e1792af0024cdccbc44', '1.3', false),
((SELECT id FROM course_id), 'Types of PMs', '8ea69787c03141babd701461d3abab62', '1.4', false),
((SELECT id FROM course_id), 'Transitioning into Product', '489431139f0b4b2ba46a882d3831e540', '1.5', false),
((SELECT id FROM course_id), 'Market research and analysis', 'deb36139c04b416daa560f83c09b88ed', '2.1', false),
((SELECT id FROM course_id), 'Identifying customer needs', '9027bc1c98db411c90083225e9d86710', '2.2', false),
((SELECT id FROM course_id), 'Creating user personas', '229b78ea2f9a407f88165f71ff315690', '2.3', false),
((SELECT id FROM course_id), 'Conducting user interviews and surveys', '60df7450105d4f808d71d870632f2ae0', '2.4', false),
((SELECT id FROM course_id), 'Defining product vision and objectives', 'e7dbf60cf74c4d66a1969335cd3e6118', '3.1', false),
((SELECT id FROM course_id), 'Creating a product roadmap', '2f1a7c8601b54fc0ae43ec60063e794c', '3.2', false),
((SELECT id FROM course_id), 'Prioritizing features and initiatives', 'e34e8dc75b6646b09645b3abf47e0f2d', '3.3', false),
((SELECT id FROM course_id), 'Setting and tracking KPIs', 'c18d7fb028174fd69ba7f7766ba13c85', '3.4', false),
((SELECT id FROM course_id), 'Understanding / analyzing competitors', '46a12960f447425db994384cf96fd09a', '3.5', false),
((SELECT id FROM course_id), 'Agile methodologies and principles', '05e3ee0e647a41a592820a95eb40c390', '4.1', false),
((SELECT id FROM course_id), 'Scrum framework', '2613b3dfb97a491fb69a7e4596e582ef', '4.2', false),
((SELECT id FROM course_id), 'Creating and managing the product backlog', '611811b1b0b3435db2c68eb2e7b1f4d3', '4.3', false),
((SELECT id FROM course_id), 'Sprint planning and review', '1cb97c605b8843e59a9a780415b90045', '4.4', false),
((SELECT id FROM course_id), 'An Agile Story', '16e0d57a09704b6d91adf5837343dd71', '4.5', false),
((SELECT id FROM course_id), 'Principles of UX design', '966b67fbb9264825b87b5ed1d3a066c9', '5.1', false),
((SELECT id FROM course_id), 'Wireframing and prototyping', '75e3f47be36046b1985e594098572c9f', '5.2', false),
((SELECT id FROM course_id), 'User testing and feedback', 'a524bf61599c496eb7be9504c21eab9d', '5.3', false),
((SELECT id FROM course_id), 'Accessibility and inclusive design principles', 'cf2e04d343464975b06eb681738413e2', '5.4', false),
((SELECT id FROM course_id), 'Best practices for PMs working w/ Designers', 'b7b3112fb44b4e40bddd28445144ece9', '5.5', false),
((SELECT id FROM course_id), 'Software development life cycle (SDLC)', '666e7558d556423caeb03330b587129c', '6.1', false),
((SELECT id FROM course_id), 'Understanding APIs and integrations', '77210326d0a143169e3590a081f5b7d4', '6.2', false),
((SELECT id FROM course_id), 'Basic programming concepts', 'f0bc763b8fda4270bbe19bfc2481409c', '6.3', false),
((SELECT id FROM course_id), 'Working with Engineers', '9c60514905ba4be9acd74acc2c01b0c3', '6.4', false),
((SELECT id FROM course_id), 'Tech debt and impact on product development', 'f1b641cea97d43c7908fe844f24c5792', '6.5', false),
((SELECT id FROM course_id), 'Introduction to data analytics', '40c7f0423d9d4bde9b927a547d049ef0', '7.1', false),
((SELECT id FROM course_id), 'Metrics and analytics for product managers', '72a880176242427182b0cec132e81884', '7.2', false),
((SELECT id FROM course_id), 'A/B testing and experimentation', 'cfc0526440b1414eb7995976919cbe00', '7.3', false),
((SELECT id FROM course_id), 'Analyzing and interpreting data', 'b62c9725cfe141eb896af2af850740aa', '7.4', false),
((SELECT id FROM course_id), 'Defining the go-to-market strategy', 'cd7d12c502d14e05a4d7121a5c15018c', '8.1', false),
((SELECT id FROM course_id), 'Coordinating product launches', 'af6b41328e6949d6830afb056c94a234', '8.2', false),
((SELECT id FROM course_id), 'Marketing and sales alignment', '4881564d4cd649d1b76625223a71a1e7', '8.3', false),
((SELECT id FROM course_id), 'Post-launch monitoring and optimization', '49529b5f6abf44e083dabce4bd411151', '8.4', false),
((SELECT id FROM course_id), 'Introduction to the 0 to 1 concept', '969038c60a594edf9ef4a42689487494', '9.1', false),
((SELECT id FROM course_id), 'Identifying and validating new product ideas', 'e25df3bdff9742588a1d0dfa091683bd', '9.2', false),
((SELECT id FROM course_id), 'Building a minimum viable product (MVP)', '9951ee962c834a93859ed8e3fbaebbf2', '9.3', false),
((SELECT id FROM course_id), 'Early-stage customer acquisition / growth', 'ec1dbbe4097542aaae0205c2d83afb37', '9.4', false),
((SELECT id FROM course_id), 'Iterating product based on user feedback', '9673d7741b64407dab52d9c54d83b626', '9.5', false),
((SELECT id FROM course_id), 'Introduction to pricing strategies', '650a587431d74e87b79f2cfcbaa4c013', '10.1', false),
((SELECT id FROM course_id), 'Cost, value, and competitor based pricing', '1558591d19ca443292b84c911dd39f9b', '10.2', false),
((SELECT id FROM course_id), 'Pricing models and monetization strategies', '6114c021bc334d85ae7920a27db96a23', '10.3', false),
((SELECT id FROM course_id), 'Price segmentation and optimization', '9a6a33042b334de984e6a74b444945b5', '10.4', false),
((SELECT id FROM course_id), 'Pricing experiments and analysis', '3be79680818447578f2cc8ef48c16de6', '10.5', false),
((SELECT id FROM course_id), 'Stages of the product lifecycle', '848cda8ccd144ff381685ac1c6eda1ff', '11.1', false),
((SELECT id FROM course_id), 'Growth and scaling strategies', 'fc8a6465c7e24f04930598d81ba61fb7', '11.2', false),
((SELECT id FROM course_id), 'Feature sunsetting and product retirement', 'eff303713bb54803a942d8ac29d43dbb', '11.3', false),
((SELECT id FROM course_id), 'Continuous improvement and innovation', 'e3eadda1f822408a8916751dff1f6cea', '11.4', false),
((SELECT id FROM course_id), 'Identifying and managing stakeholders', '83a587c184fd425a8afc55048e6753e5', '12.1', false),
((SELECT id FROM course_id), 'Effective communication techniques', '938e77d0361546f0b920a501f22b7639', '12.2', false),
((SELECT id FROM course_id), 'Leading cross-functional teams', '267bb7969abf494d8f7a235f8459e3c8', '12.3', false),
((SELECT id FROM course_id), 'Managing conflict and negotiation', '81baa2bf93da4665bbd984de62f3ec58', '12.4', false),
((SELECT id FROM course_id), 'Influencing without authority', '10089b41451144acb4e9a003f176d013', '12.5', false),
((SELECT id FROM course_id), 'Key skills / competencies for PMs', '02c32d0d56a245338f80f7c954f2a9b9', '13.1', false),
((SELECT id FROM course_id), 'Networking and personal branding', '52594845c663415b94cb977d167c2f6b', '13.2', false);

