const { Schema, model, models } = require("mongoose");

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true, // Only one "Electronics" category globally
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String, 
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Category = models.Category || model("Category", categorySchema);
module.exports = Category;