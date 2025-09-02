import mongoose, { Schema, Document } from 'mongoose';
import { ConceptMap as IConceptMap } from '../types';

export interface ConceptMapDocument extends Omit<IConceptMap, '_id'>, Document {}

const ConceptMapSchema = new Schema<ConceptMapDocument>({
  namasteCode: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  icdCode: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  icdType: {
    type: String,
    required: true,
    enum: ['TM2', 'Biomedicine'],
    index: true
  },
  equivalence: {
    type: String,
    required: true,
    enum: ['relatedto', 'equivalent', 'equal', 'wider', 'subsumes', 'narrower', 'specializes', 'inexact', 'unmatched', 'disjoint'],
    default: 'relatedto'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },
  mappedBy: {
    type: String,
    trim: true
  },
  mappedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'concept_map'
});

// Create indexes for better search performance
ConceptMapSchema.index({ namasteCode: 1, icdType: 1 });
ConceptMapSchema.index({ icdCode: 1, icdType: 1 });
ConceptMapSchema.index({ equivalence: 1 });
ConceptMapSchema.index({ confidence: -1 });
ConceptMapSchema.index({ createdAt: -1 });

// Compound index for unique mappings
ConceptMapSchema.index({ namasteCode: 1, icdCode: 1, icdType: 1 }, { unique: true });

// Virtual for FHIR ConceptMap element
ConceptMapSchema.virtual('fhirElement').get(function() {
  return {
    code: this.namasteCode,
    target: [{
      code: this.icdCode,
      equivalence: this.equivalence,
      comment: `Mapped with confidence: ${this.confidence}`
    }]
  };
});

// Ensure virtuals are serialized
ConceptMapSchema.set('toJSON', { virtuals: true });
ConceptMapSchema.set('toObject', { virtuals: true });

export default mongoose.model<ConceptMapDocument>('ConceptMap', ConceptMapSchema);
