const mongoose = require('mongoose');

const herbSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  scientificName: { type: String, default: '' },
  description: { type: String, required: true },
  benefits: [{ type: String }],
  doshaBalance: {
    vata: { type: Boolean, default: false },
    pitta: { type: Boolean, default: false },
    kapha: { type: Boolean, default: false },
  },
  category: { type: String, default: 'General' },
  usage: { type: String, required: true },
  precautions: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  tags: [{ type: String }],
  usageMethod: { type: String, default: '' },
  image: { type: String, default: '' },
  recommendedFor: [{ type: String, enum: ['Vata', 'Pitta', 'Kapha'] }],
}, { timestamps: true });

herbSchema.pre('save', function syncLegacyFields(next) {
  this.usageMethod = this.usageMethod || this.usage;
  this.image = this.image || this.imageUrl;
  this.recommendedFor = ['Vata', 'Pitta', 'Kapha'].filter((dosha) => this.doshaBalance?.[dosha.toLowerCase()]);
  next();
});

module.exports = mongoose.model('Herb', herbSchema);
