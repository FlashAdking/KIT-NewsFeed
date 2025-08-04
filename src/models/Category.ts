import { Schema, model } from "mongoose";
import { ICategory } from "./interfaces/ICategory";

const categorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },
        slug: {
            type: String,
            required: true,
            lowercase: true
        },
        description: {
            type: String,
            maxlength: 200
        },
        parentCategoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null
        },
        displayOrder: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
        {
        timestamps: true
    }
    
);

categorySchema.index( {
    parentCategoryId: 1,
    displayOrder: 1
} );

categorySchema.index({
    slug: 1
});

export const Category = model<ICategory>('Category', categorySchema);
