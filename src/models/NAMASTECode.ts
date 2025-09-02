import mongoose, { Schema, Document } from 'mongoose';
import { NAMASTECode as INAMASTECode } from '../types';

export interface NAMASTECodeDocument extends Omit<INAMASTECode, '_id'>, Document {}

const NAMASTECodeSchema = new Schema<NAMASTECodeDocument>({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  system: {
    type: String,
    default: 'https://namaste.ayush.gov.in/codes',
    trim: true
  }
}, {
  timestamps: true,
  collection: 'namaste_codes'
});

// Create indexes for better search performance
NAMASTECodeSchema.index({ name: 'text', description: 'text' });
NAMASTECodeSchema.index({ category: 1 });
NAMASTECodeSchema.index({ createdAt: -1 });

// Virtual for FHIR CodeSystem concept
NAMASTECodeSchema.virtual('fhirConcept').get(function() {
  return {
    code: this.code,
    display: this.name,
    definition: this.description
  };
});

// Ensure virtuals are serialized
NAMASTECodeSchema.set('toJSON', { virtuals: true });
NAMASTECodeSchema.set('toObject', { virtuals: true });

export default mongoose.model<NAMASTECodeDocument>('NAMASTECode', NAMASTECodeSchema);
