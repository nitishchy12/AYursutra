const Herb = require('../models/Herb');

const herbs = [
  ['Ashwagandha', 'Withania somnifera', 'Adaptogen', ['Stress resilience', 'Sleep support', 'Strength and stamina', 'Nervous system nourishment'], { vata: true, pitta: false, kapha: true }, 'Take powder with warm milk at night or use capsules as directed.', 'Avoid during pregnancy unless supervised; may increase sedation.', ['stress', 'sleep', 'vitality']],
  ['Tulsi (Holy Basil)', 'Ocimum tenuiflorum', 'Immunomodulator', ['Respiratory support', 'Stress balance', 'Immune support', 'Healthy metabolism'], { vata: true, pitta: false, kapha: true }, 'Steep fresh or dried leaves as tea for 5-10 minutes.', 'Use cautiously with blood thinners or before surgery.', ['tea', 'respiratory', 'immune']],
  ['Turmeric', 'Curcuma longa', 'Anti-inflammatory', ['Joint comfort', 'Skin health', 'Digestive fire', 'Antioxidant support'], { vata: true, pitta: false, kapha: true }, 'Use in food with black pepper or prepare golden milk.', 'High doses may aggravate acidity or interact with anticoagulants.', ['joint', 'skin', 'digestion']],
  ['Triphala', 'Amalaki, Haritaki, Bibhitaki', 'Digestive', ['Bowel regularity', 'Gentle detoxification', 'Eye health', 'Antioxidant support'], { vata: true, pitta: true, kapha: true }, 'Take powder in warm water before bed or as tablets.', 'Reduce dose if loose stools occur.', ['detox', 'bowel', 'rasayana']],
  ['Brahmi', 'Bacopa monnieri', 'Nervine', ['Memory support', 'Focus', 'Calm mind', 'Sleep quality'], { vata: true, pitta: true, kapha: false }, 'Use as tea, ghee, or standardized extract.', 'May cause digestive upset in high doses.', ['memory', 'focus', 'mind']],
  ['Neem', 'Azadirachta indica', 'Skin and Blood', ['Skin clarity', 'Oral health', 'Blood purification', 'Microbial balance'], { vata: false, pitta: true, kapha: true }, 'Use capsules, decoction, or topical preparations.', 'Avoid in pregnancy and in very depleted Vata states.', ['skin', 'oral', 'blood']],
  ['Amalaki (Amla)', 'Emblica officinalis', 'Rasayana', ['Vitamin C support', 'Cooling rejuvenation', 'Hair health', 'Digestive balance'], { vata: true, pitta: true, kapha: true }, 'Take powder with water, chyawanprash, or fresh fruit.', 'May be too sour for severe acidity in some people.', ['rejuvenation', 'hair', 'cooling']],
  ['Shatavari', 'Asparagus racemosus', 'Reproductive Tonic', ['Women health', 'Cooling nourishment', 'Hormonal balance', 'Digestive soothing'], { vata: true, pitta: true, kapha: false }, 'Mix powder with warm milk or take capsules.', 'Use cautiously with estrogen-sensitive conditions.', ['women', 'cooling', 'tonic']],
  ['Guduchi (Giloy)', 'Tinospora cordifolia', 'Immunomodulator', ['Immune resilience', 'Fever recovery', 'Liver support', 'Inflammation balance'], { vata: true, pitta: true, kapha: true }, 'Use stem decoction, tablets, or juice.', 'Use caution with autoimmune medication.', ['immune', 'liver', 'fever']],
  ['Licorice Root', 'Glycyrrhiza glabra', 'Demulcent', ['Throat comfort', 'Adrenal support', 'Digestive soothing', 'Respiratory lubrication'], { vata: true, pitta: true, kapha: false }, 'Prepare as tea or use powder in small amounts.', 'Avoid with uncontrolled hypertension or kidney disease.', ['throat', 'adrenal', 'soothing']],
  ['Ginger', 'Zingiber officinale', 'Digestive', ['Nausea relief', 'Circulation', 'Digestive fire', 'Respiratory warmth'], { vata: true, pitta: false, kapha: true }, 'Use fresh tea, food spice, or dry ginger powder.', 'High amounts can worsen heat or acidity.', ['agni', 'nausea', 'warm']],
  ['Cardamom', 'Elettaria cardamomum', 'Carminative', ['Fresh breath', 'Gas relief', 'Digestive comfort', 'Balanced sweetness'], { vata: true, pitta: true, kapha: true }, 'Crush pods into tea, milk, or food.', 'Generally gentle; use moderate culinary amounts.', ['spice', 'gas', 'tea']],
  ['Cinnamon', 'Cinnamomum verum', 'Circulatory', ['Blood sugar support', 'Warm digestion', 'Circulation', 'Kapha balance'], { vata: true, pitta: false, kapha: true }, 'Use as spice or simmer stick in tea.', 'Avoid high doses in pregnancy or liver disease.', ['warming', 'circulation', 'kapha']],
  ['Fenugreek', 'Trigonella foenum-graecum', 'Metabolic', ['Glucose metabolism', 'Lactation support', 'Digestive tone', 'Joint comfort'], { vata: false, pitta: true, kapha: true }, 'Soak seeds overnight or use in cooking.', 'May lower blood sugar; monitor with diabetes medication.', ['metabolism', 'seeds', 'joints']],
  ['Black Pepper', 'Piper nigrum', 'Bioavailability', ['Enhances absorption', 'Clears Kapha', 'Digestive stimulation', 'Respiratory support'], { vata: false, pitta: false, kapha: true }, 'Use freshly ground in food with herbs like turmeric.', 'Can aggravate acidity and heat in excess.', ['piperine', 'agni', 'kapha']],
  ['Long Pepper', 'Piper longum', 'Respiratory', ['Lung support', 'Digestive fire', 'Rejuvenation', 'Kapha clearing'], { vata: true, pitta: false, kapha: true }, 'Use small amounts in formulas or honey preparations.', 'Avoid excessive use in high Pitta conditions.', ['pippali', 'lungs', 'rejuvenation']],
  ['Vidanga', 'Embelia ribes', 'Digestive Cleanse', ['Gut cleansing', 'Bloating relief', 'Metabolic support', 'Kapha reduction'], { vata: false, pitta: false, kapha: true }, 'Use only in practitioner-guided formulas.', 'Not for pregnancy; avoid long-term unsupervised use.', ['gut', 'cleanse', 'kapha']],
  ['Haritaki', 'Terminalia chebula', 'Rasayana', ['Regular elimination', 'Vata balance', 'Respiratory support', 'Rejuvenation'], { vata: true, pitta: false, kapha: true }, 'Take powder with warm water, often at night.', 'Adjust dose if stools become loose.', ['elimination', 'vata', 'rasayana']],
  ['Bibhitaki', 'Terminalia bellirica', 'Kapha Cleanse', ['Respiratory clarity', 'Hair support', 'Digestive tone', 'Kapha balance'], { vata: false, pitta: true, kapha: true }, 'Commonly taken as part of Triphala.', 'Use moderately in dry constipation.', ['kapha', 'hair', 'triphala']],
  ['Manjistha', 'Rubia cordifolia', 'Blood and Lymph', ['Skin clarity', 'Lymph flow', 'Blood purification', 'Pitta balance'], { vata: false, pitta: true, kapha: true }, 'Use powder, capsules, or decoction under guidance.', 'Use caution with anticoagulants.', ['skin', 'lymph', 'pitta']],
];

const imageUrls = [
  'https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1606914501449-5a96b6ce24ca?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=900&q=80',
];

function toRecord(item, index) {
  const [name, scientificName, category, benefits, doshaBalance, usage, precautions, tags] = item;
  return {
    name, scientificName, category, benefits, doshaBalance, usage, precautions, tags,
    description: `${name} is a respected Ayurvedic herb used in traditional formulations for ${benefits[0].toLowerCase()} and ${benefits[1].toLowerCase()}. It is selected according to prakriti, season, digestive strength, and the person's current imbalance.`,
    imageUrl: imageUrls[index % imageUrls.length],
    usageMethod: usage,
    image: imageUrls[index % imageUrls.length],
    recommendedFor: ['Vata', 'Pitta', 'Kapha'].filter((dosha) => doshaBalance[dosha.toLowerCase()]),
  };
}

async function seedHerbs({ onlyIfEmpty = false } = {}) {
  if (onlyIfEmpty && await Herb.countDocuments() > 0) return { skipped: true, count: await Herb.countDocuments() };
  const records = herbs.map(toRecord);
  await Promise.all(records.map((herb) => Herb.updateOne({ name: herb.name }, { $set: herb }, { upsert: true, runValidators: true })));
  return { skipped: false, count: records.length };
}

module.exports = { seedHerbs, herbSeedData: herbs.map(toRecord) };
