const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false
        },
        profile: {
            phone: {
                type: String,
                default: ""
            },
            collage: {
                type: String,
                default: ""
            },
            degree: {
                type: String,
                default: ""
            },
            graduationYear: {
                type: Number,
                default: null
            }
        }
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model("User", userSchema);