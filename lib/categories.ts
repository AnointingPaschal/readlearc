// ─── Readlearc Academic Taxonomy ───────────────────────────────────────────
export interface CourseField {
  id: string;
  label: string;
  topics: string[];
}

export interface Faculty {
  id: string;
  label: string;
  color: string;
  icon: string;
  courses: CourseField[];
}

export const FACULTIES: Faculty[] = [
  {
    id: "sciences", label: "Natural Sciences", color: "#0284c7", icon: "🔬",
    courses: [
      { id: "mathematics", label: "Mathematics", topics: ["Pure Mathematics","Applied Mathematics","Statistics & Probability","Number Theory","Algebra","Calculus & Real Analysis","Topology","Discrete Mathematics","Actuarial Science","Mathematical Modeling","Numerical Methods","Combinatorics","Differential Equations","Complex Analysis","Functional Analysis","Cryptography","Optimization"] },
      { id: "physics", label: "Physics", topics: ["Classical Mechanics","Quantum Mechanics","Thermodynamics","Electromagnetism","Astrophysics","Nuclear Physics","Particle Physics","Optics & Photonics","Condensed Matter Physics","Plasma Physics","General Relativity","Acoustics","Biophysics","Atmospheric Physics","Computational Physics","Medical Physics"] },
      { id: "chemistry", label: "Chemistry", topics: ["Organic Chemistry","Inorganic Chemistry","Physical Chemistry","Analytical Chemistry","Biochemistry","Computational Chemistry","Green Chemistry","Polymer Chemistry","Medicinal Chemistry","Electrochemistry","Industrial Chemistry","Environmental Chemistry","Supramolecular Chemistry","Astrochemistry","Nuclear Chemistry"] },
      { id: "biology", label: "Biology", topics: ["Molecular Biology","Cell Biology","Genetics & Genomics","Ecology","Zoology","Botany","Microbiology","Evolutionary Biology","Marine Biology","Neuroscience","Developmental Biology","Immunology","Parasitology","Structural Biology","Bioinformatics","Systems Biology","Epigenetics","Proteomics","Mycology","Virology"] },
      { id: "earth_sciences", label: "Earth Sciences", topics: ["Geology","Geophysics","Meteorology","Oceanography","Hydrology","Soil Science","Volcanology","Seismology","Climatology","Palaeontology","Remote Sensing","Environmental Science","Mineralogy","Geomorphology","Glaciology"] },
      { id: "astronomy", label: "Astronomy & Space Science", topics: ["Observational Astronomy","Astrophysics","Cosmology","Planetary Science","Stellar Physics","Galactic Astronomy","Radio Astronomy","Space Exploration","Exoplanets","Dark Matter & Energy","Astrochemistry","High Energy Astrophysics"] },
      { id: "neuroscience", label: "Neuroscience", topics: ["Cognitive Neuroscience","Computational Neuroscience","Neuroanatomy","Neurophysiology","Behavioral Neuroscience","Clinical Neuroscience","Neuroimaging","Molecular Neuroscience","Developmental Neuroscience"] },
    ]
  },
  {
    id: "engineering", label: "Engineering & Technology", color: "#d97706", icon: "⚙️",
    courses: [
      { id: "computer_science", label: "Computer Science", topics: ["Algorithms & Data Structures","Artificial Intelligence","Machine Learning","Deep Learning","Computer Vision","Natural Language Processing","Cybersecurity","Cloud Computing","Distributed Systems","Database Systems","Software Engineering","Operating Systems","Computer Networks","Human-Computer Interaction","Quantum Computing","Blockchain & Web3","Robotics","Data Science","Web Development","Embedded Systems","Compiler Design","Formal Methods","Parallel Computing","Edge Computing","Computer Graphics"] },
      { id: "electrical", label: "Electrical Engineering", topics: ["Circuit Theory","Electronics","Power Systems","Control Systems","Signal Processing","Telecommunications","VLSI Design","Microelectronics","Wireless Communications","Power Electronics","Photovoltaics","Embedded Systems","Digital Signal Processing","RF Engineering","Electromagnetic Compatibility"] },
      { id: "mechanical", label: "Mechanical Engineering", topics: ["Fluid Mechanics","Thermodynamics","Manufacturing Processes","Robotics","CAD/CAM","Heat Transfer","Machine Design","Dynamics","Aerospace Propulsion","HVAC Systems","Materials Science","Mechatronics","Tribology","Combustion Engineering","Acoustics & Vibrations"] },
      { id: "civil", label: "Civil Engineering", topics: ["Structural Engineering","Geotechnical Engineering","Transportation Engineering","Water Resources","Environmental Engineering","Urban Planning","Construction Management","Coastal Engineering","Bridge Engineering","Highway Engineering","Earthquake Engineering","Infrastructure Management","Smart Cities","Traffic Engineering"] },
      { id: "chemical_eng", label: "Chemical Engineering", topics: ["Process Engineering","Reaction Engineering","Transport Phenomena","Petroleum Engineering","Polymer Engineering","Food Process Engineering","Pharmaceutical Engineering","Nanotechnology","Biochemical Engineering","Materials Processing","Process Safety","Catalysis","Separation Processes"] },
      { id: "aerospace", label: "Aerospace Engineering", topics: ["Aerodynamics","Propulsion Systems","Spacecraft Design","Flight Mechanics","Avionics","Orbital Mechanics","Composite Materials","Wind Tunnel Testing","UAV Systems","Satellite Technology","Re-entry Vehicles","Space Structures","Flight Simulation"] },
      { id: "biomedical", label: "Biomedical Engineering", topics: ["Medical Imaging","Biomechanics","Tissue Engineering","Neural Engineering","Prosthetics & Orthotics","Drug Delivery Systems","Bioinformatics","Medical Devices","Clinical Engineering","Biosensors","Genomic Engineering","Synthetic Biology","Wearable Technology","Regenerative Medicine"] },
      { id: "environmental_eng", label: "Environmental Engineering", topics: ["Water Treatment","Waste Management","Air Pollution Control","Renewable Energy Systems","Sustainable Design","Environmental Impact Assessment","Green Building","Carbon Capture","Soil Remediation","Noise Control","Life Cycle Assessment"] },
      { id: "materials", label: "Materials Science & Engineering", topics: ["Nanomaterials","Ceramics","Metals & Alloys","Polymers","Composites","Semiconductors","Biomaterials","Smart Materials","Thin Films","Crystallography","Battery Technology","Superconductors","Corrosion Science"] },
      { id: "software_eng", label: "Software Engineering", topics: ["Software Architecture","Agile & Scrum","DevOps & CI/CD","Testing & QA","Requirements Engineering","IT Project Management","Microservices","API Design","Security Engineering","Open Source Development","Mobile Development","AR/VR Development","Game Development"] },
      { id: "industrial", label: "Industrial & Systems Engineering", topics: ["Operations Research","Lean Manufacturing","Six Sigma","Quality Engineering","Ergonomics","Simulation & Modeling","Logistics","Systems Engineering","Production Planning","Risk Analysis"] },
    ]
  },
  {
    id: "medicine", label: "Medical & Health Sciences", color: "#dc2626", icon: "🏥",
    courses: [
      { id: "medicine_gen", label: "Medicine & Surgery", topics: ["Internal Medicine","Surgery","Cardiology","Oncology","Neurology","Pediatrics","Psychiatry","Dermatology","Orthopedics","Ophthalmology","Emergency Medicine","Infectious Diseases","Endocrinology","Gastroenterology","Nephrology","Pulmonology","Rheumatology","Pathology","Radiology","Anesthesiology","Urology","Gynecology & Obstetrics","Hepatology","Hematology","Immunology","Tropical Medicine","Palliative Care","Geriatrics"] },
      { id: "public_health", label: "Public Health & Epidemiology", topics: ["Epidemiology","Biostatistics","Health Policy","Global Health","Infectious Disease Control","Health Promotion","Environmental Health","Occupational Health","Maternal Health","Child Health","Nutrition Policy","Health Economics","One Health","Digital Health","Vaccinology","Non-Communicable Diseases"] },
      { id: "pharmacy", label: "Pharmacy & Pharmacology", topics: ["Clinical Pharmacy","Pharmacokinetics","Drug Discovery","Toxicology","Pharmaceutical Chemistry","Biopharmaceutics","Pharmacogenomics","Herbal Medicine","Hospital Pharmacy","Industrial Pharmacy","Pharmacoepidemiology","Drug Regulation","Nanopharmaceutics"] },
      { id: "nursing", label: "Nursing & Midwifery", topics: ["Critical Care Nursing","Mental Health Nursing","Pediatric Nursing","Community Health Nursing","Midwifery","Nursing Informatics","Evidence-Based Practice","Palliative Care","Geriatric Nursing","Surgical Nursing","Oncology Nursing","Neonatal Nursing"] },
      { id: "psychology", label: "Psychology", topics: ["Clinical Psychology","Cognitive Psychology","Developmental Psychology","Social Psychology","Neuropsychology","Forensic Psychology","Health Psychology","Organizational Psychology","Sports Psychology","Child Psychology","Behavioral Psychology","Positive Psychology","Educational Psychology","Psychotherapy","Trauma Psychology"] },
      { id: "nutrition", label: "Nutrition & Dietetics", topics: ["Clinical Nutrition","Sports Nutrition","Pediatric Nutrition","Obesity & Metabolism","Food Science","Nutritional Biochemistry","Gut Microbiome","Eating Disorders","Community Nutrition","Functional Foods","Nutrigenomics","Maternal Nutrition"] },
      { id: "physiotherapy", label: "Physiotherapy & Rehabilitation", topics: ["Musculoskeletal Therapy","Neurological Rehabilitation","Pediatric Physiotherapy","Sports Physiotherapy","Cardiopulmonary Therapy","Occupational Therapy","Speech & Language Therapy","Pain Management","Aquatic Therapy","Geriatric Rehabilitation","Vestibular Rehabilitation"] },
      { id: "dentistry", label: "Dentistry & Oral Health", topics: ["Orthodontics","Periodontics","Endodontics","Oral Surgery","Prosthodontics","Pediatric Dentistry","Oral Pathology","Dental Implants","Community Dentistry","Digital Dentistry","Oral Medicine","Forensic Odontology"] },
    ]
  },
  {
    id: "social_sciences", label: "Social Sciences", color: "#7c3aed", icon: "🌍",
    courses: [
      { id: "economics", label: "Economics", topics: ["Macroeconomics","Microeconomics","Development Economics","Behavioral Economics","International Economics","Labor Economics","Health Economics","Environmental Economics","Financial Economics","Econometrics","Public Finance","Urban Economics","Agricultural Economics","Economic History","Institutional Economics","Digital Economics","Game Theory"] },
      { id: "political_science", label: "Political Science", topics: ["Comparative Politics","International Relations","Political Theory","Public Administration","Electoral Studies","Constitutional Law","Geopolitics","Conflict Studies","Governance & Democracy","Foreign Policy","Political Economy","Security Studies","Human Rights","Federalism","Political Sociology"] },
      { id: "sociology", label: "Sociology", topics: ["Social Theory","Urban Sociology","Race & Ethnicity","Gender Studies","Family Sociology","Crime & Deviance","Religion in Society","Social Movements","Medical Sociology","Globalization","Digital Sociology","Social Stratification","Environmental Sociology","Migration Studies","Sociology of Education"] },
      { id: "anthropology", label: "Anthropology", topics: ["Cultural Anthropology","Physical Anthropology","Archaeology","Linguistic Anthropology","Medical Anthropology","Environmental Anthropology","Urban Anthropology","Development Anthropology","Forensic Anthropology","Cognitive Anthropology","Visual Anthropology"] },
      { id: "geography", label: "Geography", topics: ["Human Geography","Physical Geography","Urban Geography","GIS & Remote Sensing","Economic Geography","Political Geography","Environmental Geography","Cultural Geography","Population Geography","Coastal Geography","Biogeography","Urban & Regional Planning"] },
      { id: "criminology", label: "Criminology & Criminal Justice", topics: ["Criminal Justice","Forensic Science","Penology","Victimology","Cybercrime","Organized Crime","White-Collar Crime","Juvenile Justice","Policing","Terrorism Studies","Restorative Justice","Corrections","Forensic Psychology","Crime Prevention"] },
      { id: "int_relations", label: "International Relations & Development", topics: ["Diplomacy","International Law","Global Governance","Peace & Security","Development Studies","Humanitarian Affairs","International Trade","Sanctions & Statecraft","Regional Studies","Climate Diplomacy","Peacebuilding","Refugee Studies","Global Health Governance"] },
      { id: "communication", label: "Communication & Media Studies", topics: ["Journalism","Media Studies","Public Relations","Advertising","Digital Media","Film Studies","Broadcasting","Science Communication","Political Communication","Intercultural Communication","Social Media","Information Science"] },
    ]
  },
  {
    id: "humanities", label: "Humanities & Arts", color: "#b45309", icon: "📚",
    courses: [
      { id: "history", label: "History", topics: ["Ancient History","Medieval History","Modern History","Contemporary History","World History","Colonial History","Military History","Economic History","Social History","African History","Asian History","American History","European History","History of Science","Oral History","Public History","Digital History"] },
      { id: "philosophy", label: "Philosophy", topics: ["Ethics & Moral Philosophy","Logic","Metaphysics","Epistemology","Philosophy of Mind","Political Philosophy","Philosophy of Science","Aesthetics","Existentialism","Analytic Philosophy","Eastern Philosophy","Applied Ethics","Bioethics","Environmental Ethics","Philosophy of Language","Phenomenology"] },
      { id: "literature", label: "Literature & Linguistics", topics: ["English Literature","World Literature","Comparative Literature","Postcolonial Literature","Children's Literature","Literary Theory","Applied Linguistics","Phonetics & Phonology","Sociolinguistics","Psycholinguistics","Second Language Acquisition","Translation Studies","Creative Writing","African Literature","Diaspora Literature","Digital Humanities"] },
      { id: "religious_studies", label: "Religious & Theological Studies", topics: ["Comparative Religion","Islamic Studies","Christian Theology","Jewish Studies","Hindu Studies","Buddhist Studies","Secularism & Atheism","Ethics in Religion","Sacred Texts","Religion & Politics","Interfaith Dialogue","New Religious Movements","African Traditional Religion"] },
      { id: "fine_arts", label: "Fine Arts & Design", topics: ["Painting & Drawing","Sculpture","Photography","Graphic Design","Industrial Design","Fashion Design","Ceramics","Art History","Contemporary Art","Digital Art","Architecture","Landscape Architecture","Interior Design","Art Conservation","Illustration","Typography"] },
      { id: "music", label: "Music & Performing Arts", topics: ["Music Theory","Composition","Performance","Ethnomusicology","Music Technology","Film Scoring","Jazz Studies","Classical Music","Music Education","Theatre Studies","Dance","Opera","Music Production","Popular Music Studies"] },
      { id: "classics", label: "Classical & Ancient Studies", topics: ["Ancient Greek","Latin","Classical Archaeology","Ancient Philosophy","Mythology","Byzantine Studies","Roman History","Epigraphy","Numismatics","Near Eastern Studies","Egyptology","Biblical Studies"] },
      { id: "cultural_studies", label: "Cultural Studies", topics: ["Cultural Theory","Postcolonial Studies","Postmodernism","Memory Studies","Heritage Studies","Popular Culture","Identity Politics","Transnational Studies","Material Culture","Food Studies"] },
    ]
  },
  {
    id: "business", label: "Business & Management", color: "#059669", icon: "💼",
    courses: [
      { id: "finance", label: "Finance & Accounting", topics: ["Corporate Finance","Investment Analysis","Financial Modeling","Accounting Principles","Auditing","Tax Accounting","Risk Management","Financial Markets","Derivatives","ESG Investing","Forensic Accounting","Managerial Accounting","International Finance","Banking","Insurance","Islamic Finance","Cryptocurrency & DeFi","Private Equity","Financial Regulation"] },
      { id: "marketing", label: "Marketing", topics: ["Digital Marketing","Consumer Behavior","Brand Management","Market Research","Social Media Marketing","Content Strategy","SEO & Analytics","Advertising","International Marketing","Sports Marketing","Healthcare Marketing","Retail Marketing","B2B Marketing","Influencer Marketing","E-commerce","Neuromarketing","Sustainability Marketing"] },
      { id: "management", label: "Management & Leadership", topics: ["Strategic Management","Organizational Behavior","Leadership & Change","Human Resource Management","Operations Management","Supply Chain Management","Project Management","Business Ethics","Corporate Governance","Sustainability Management","International Business","Knowledge Management","Crisis Management","Cross-cultural Management"] },
      { id: "entrepreneurship", label: "Entrepreneurship & Innovation", topics: ["Startup Ecosystems","Business Planning","Venture Capital","Product Development","Lean Startup","Social Entrepreneurship","Tech Entrepreneurship","Family Business","Scaling Operations","Design Thinking","Open Innovation","Corporate Entrepreneurship","Frugal Innovation"] },
      { id: "data_analytics", label: "Business Analytics & Data Science", topics: ["Business Intelligence","Data Visualization","Predictive Analytics","Machine Learning for Business","Supply Chain Analytics","Financial Analytics","HR Analytics","Marketing Analytics","Operations Analytics","Text Mining"] },
    ]
  },
  {
    id: "law", label: "Law & Legal Studies", color: "#1d4ed8", icon: "⚖️",
    courses: [
      { id: "law_gen", label: "Law", topics: ["Constitutional Law","Criminal Law & Procedure","Contract Law","Tort Law","Property Law","Administrative Law","Family Law","Corporate Law","International Law","Human Rights Law","Environmental Law","Intellectual Property","Tax Law","Cyber Law & Technology","Immigration Law","Labour Law","Medical Law & Ethics","Maritime Law","Conflict of Laws","EU Law","Competition Law","Insurance Law","Banking Law","Real Estate Law","Refugee Law"] },
    ]
  },
  {
    id: "education", label: "Education & Teaching", color: "#0e7490", icon: "🎓",
    courses: [
      { id: "education_gen", label: "Education", topics: ["Curriculum & Instruction","Educational Psychology","Special Education","Early Childhood Education","Higher Education Administration","STEM Education","Adult & Continuing Education","Distance & Online Learning","Educational Technology","Comparative Education","Teacher Training","Educational Leadership","Multicultural Education","Assessment & Evaluation","Literacy Education","Language Education","Art Education","Physical Education","Vocational Education","Education Policy"] },
    ]
  },
  {
    id: "agriculture", label: "Agriculture, Food & Veterinary", color: "#16a34a", icon: "🌾",
    courses: [
      { id: "agriculture_gen", label: "Agriculture & Agronomy", topics: ["Crop Science","Animal Science","Agricultural Economics","Soil Science","Horticulture","Agronomy","Plant Pathology","Irrigation & Water Management","Precision Agriculture","Agroforestry","Post-Harvest Technology","Agricultural Biotechnology","Aquaculture","Sustainable Agriculture","Farm Management","Plant Breeding","Agricultural Extension"] },
      { id: "food_science", label: "Food Science & Technology", topics: ["Food Chemistry","Food Microbiology","Food Safety & Quality","Food Processing","Food Packaging","Fermentation Technology","Sensory Science","Nutritional Science","Food Biotechnology","Quality Control","Food Policy","Functional Foods","Food Engineering","Dairy Technology","Beverage Technology"] },
      { id: "veterinary", label: "Veterinary Medicine & Animal Science", topics: ["Animal Anatomy","Veterinary Pharmacology","Wildlife Medicine","Poultry Science","Livestock Production","Veterinary Surgery","Animal Nutrition","Veterinary Epidemiology","One Health","Companion Animal Medicine","Aquatic Animal Health","Veterinary Pathology","Zoo Animal Medicine"] },
    ]
  },
  {
    id: "environment", label: "Environmental & Sustainability", color: "#15803d", icon: "🌿",
    courses: [
      { id: "env_gen", label: "Environmental Science & Policy", topics: ["Climate Change & Mitigation","Biodiversity & Conservation","Pollution & Remediation","Ecosystem Ecology","Sustainable Development","Environmental Policy","Renewable Energy","Carbon Footprint & Offsetting","Water Security","Environmental Economics","Environmental Law","Green Technology","Waste Management & Circular Economy","Ocean Science","Forest Science","Landscape Ecology","Urban Ecology","Environmental Justice","Nature-Based Solutions"] },
    ]
  },
  {
    id: "information", label: "Information & Library Science", color: "#6d28d9", icon: "🗂️",
    courses: [
      { id: "info_science", label: "Information Science", topics: ["Knowledge Management","Data Curation","Digital Libraries","Information Architecture","Metadata Standards","Information Retrieval","Digital Preservation","Open Access","Scholarly Communication","Archival Science","Records Management","Research Data Management","Bibliometrics & Scientometrics"] },
    ]
  },
];

// ── Derived flat lists ──────────────────────────────────────────────────────
export const ALL_COURSES = FACULTIES.flatMap(f =>
  f.courses.map(c => ({
    id: c.id, label: c.label, topics: c.topics,
    faculty: f.label, facultyId: f.id,
    color: f.color, icon: f.icon,
  }))
);

export const COURSE_BY_ID: Record<string, typeof ALL_COURSES[0]> =
  Object.fromEntries(ALL_COURSES.map(c => [c.id, c]));

// ── Article metadata ────────────────────────────────────────────────────────
export const ARTICLE_TYPES = [
  "Analysis","Opinion","Tutorial","Review","Case Study",
  "News & Commentary","Interview","Explainer","Essay",
  "Technical Report","Research Summary","Book Review",
];

// ── Research-specific ───────────────────────────────────────────────────────
export const RESEARCH_TYPES = [
  "Empirical Study","Literature Review","Systematic Review","Meta-Analysis",
  "Case Study","Theoretical Paper","Experimental Research","Qualitative Study",
  "Quantitative Study","Mixed Methods","Action Research","Survey Research",
  "Historical Research","Pilot Study","Longitudinal Study","Cross-Sectional Study",
  "Scoping Review","Narrative Review","Cohort Study","Randomized Controlled Trial",
];

export const ACADEMIC_LEVELS = [
  "Undergraduate","Postgraduate (Masters)","Doctoral (PhD)",
  "Post-Doctoral","Professional / Practitioner",
];

export const RESEARCH_SECTION_TYPES = [
  "Abstract","Introduction","Background","Literature Review",
  "Theoretical Framework","Research Questions & Hypotheses",
  "Methodology","Data Collection","Results","Analysis",
  "Discussion","Implications","Limitations","Recommendations",
  "Conclusion","Ethical Considerations","Acknowledgements",
  "References","Appendix","Glossary","Custom",
];
