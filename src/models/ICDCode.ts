import mongoose, { Schema, Document } from 'mongoose';
import { ICDCode as IICDCode } from '../types';

export interface ICDCodeDocument extends Omit<IICDCode, '_id'>, Document {}

const ICDCodeSchema = new Schema<ICDCodeDocument>({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['TM2', 'Biomedicine'],
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  system: {
    type: String,
    required: true,
    default: 'https://icd.who.int/icdapi/',
    trim: true
  },
  version: {
    type: String,
    default: '11'
  }
}, {
  timestamps: true,
  collection: 'icd_codes'
});

// Create indexes for better search performance
ICDCodeSchema.index({ title: 'text', description: 'text' });
ICDCodeSchema.index({ type: 1, code: 1 });
ICDCodeSchema.index({ createdAt: -1 });

// Virtual for FHIR CodeSystem concept
ICDCodeSchema.virtual('fhirConcept').get(function() {
  return {
    code: this.code,
    display: this.title,
    definition: this.description
  };
});

// Ensure virtuals are serialized
ICDCodeSchema.set('toJSON', { virtuals: true });
ICDCodeSchema.set('toObject', { virtuals: true });

export default mongoose.model<ICDCodeDocument>('ICDCode', ICDCodeSchema);
