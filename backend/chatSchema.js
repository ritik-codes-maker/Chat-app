import {Schema} from 'mongoose';
import mongoose from 'mongoose';

const chatSchema = new Schema({
    message : {type : String ,  required : true },
    user : {type : String , required : true },
},{ timeStamps : true})

const ChatMessage = mongoose.model("ChatMessage", chatSchema);

export default ChatMessage;