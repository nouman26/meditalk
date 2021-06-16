const mongoose=require("mongoose")
// mongoose.connect('mongodb://localhost:27017/default', {useNewUrlParser: true, useUnifiedTopology: true,'useFindAndModify': false});
mongoose.connect('mongodb+srv://asdfghjkl:asdfghjkl@nouman.ca2u5.mongodb.net/default?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});

const signschema = new mongoose.Schema({
    name: String,
    email: String,
    password:String
  });

const doctor_basic_info_schema = new mongoose.Schema({
    image:String,
    name:String,
    email:String,
    firstname: String,
    lastname:String,
    gender:String,
    phone_no:String,
    date_of_birth:String,
    biography:String,
    clinic_name:String,
    clinic_address:String,
    price:String,
    service:String,
    specialist:String,
    education:String,
    hospital_name:String,
    from:String,
    to:String,
    awards:String,
    ep_ac_no:String,
    ep_ac_name:String,
    jc_ac_no:String,
    jc_ac_name:String
    
});

const patient_basic_info_schema = new mongoose.Schema({
    name:String,
    email:String,
    image:String,
    gender:String,
    phone_no:String,
    blood_group:String,
    age:String,
    date_of_birth:String,
    address:String
});

const doctor_shedule_schema = new mongoose.Schema({
  date: String,
  time:String
});

const doctor_day_vise_shedule_schema = new mongoose.Schema({
  day: String,
  t:String
});

const patient_medical_history_schema = new mongoose.Schema({
  disease_name: String,
  disease_duration:String,
  disease_date:String
});

const appoint_schema = new mongoose.Schema({
  name:String,
  email: String,
  patient_image:String,
  ac_type: String,
  account_no: String,
  date: String,
  time:String,
  trx: String,
  image: String,
  condition:String,
  video_link:String
});

module.exports.sign=signschema;
module.exports.doctor_basic_info=doctor_basic_info_schema;
module.exports.patient_basic_info=patient_basic_info_schema;
module.exports.doctor_shedule=doctor_shedule_schema;
module.exports.patient_medical_history=patient_medical_history_schema;
module.exports.doctor_day_vise_shedule=doctor_day_vise_shedule_schema;

module.exports.appoint=appoint_schema;