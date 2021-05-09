var express = require('express');
var path = require('path');
const bodyParser=require("body-parser");
var router = express.Router();
const mongoose=require("mongoose");
var fs = require('fs');
const multer = require("multer");
const schema=require("../modules/schema");

var app = express();

// Schemas of DB's
signschema=schema.sign;
doctor_basic_info_schema=schema.doctor_basic_info;
patient_basic_info_schema=schema.patient_basic_info;
doctor_shedule_schema=schema.doctor_shedule;
patient_medical_history_schema=schema.patient_medical_history;
doctor_day_vise_shedule_schema=schema.doctor_day_vise_shedule;
appoint_schema=schema.appoint;

// Connection with different Db
const myDBsign = mongoose.connection.useDb('data');
const DrShedule = mongoose.connection.useDb('doctors_shedule');
const DrSheduleTime = mongoose.connection.useDb('doctors_shedule_day_vise');
const PMhistory = mongoose.connection.useDb('patient_medical_history');
const TempappDr = mongoose.connection.useDb('appointments_of_doctor');
const TempappPat = mongoose.connection.useDb('appointment_of_patient');

// some common Model
var DoctorBasicInfoModel=myDBsign.model("doctor-basic-info",doctor_basic_info_schema);
var PatientBasicInfoModel=myDBsign.model("patient-basic-info",patient_basic_info_schema);

// Body Parsers
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

var profileemail;
var occupation;
var display="none";
var dispmsg="none";
var dispdrmsg="none";
var logdata,occup; // to hold login details
var imagename;
var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	var yyyy = today.getFullYear();
	today = dd + '/' + mm + '/' + yyyy;

router.get("/",(req,res)=>{
    var filter_data=DoctorBasicInfoModel.find();
    filter_data.exec(function(err,data){
        if (err) {
            var error = 'Something bad happened, try again!';
            if(err.code === 11000) {
              error = 'That email is already taken, try another.';
            }
            res.render('blank', { error: error ,data:data});
        }
        if (profileemail == "" || profileemail == null || profileemail == undefined){
            res.render("index",{read:data,data:"",logpro:"none",logdis:"",occupation:""})
        }
        else{
            res.render("index",{read:data,data:logdata[0],logpro:"",logdis:"none",occupation:occup}) 
        }
    })
})

router.get("/doctor",function(req,res){
    var filter_data=DoctorBasicInfoModel.find({});
    filter_data.exec(function(err,data){
        if (err) throw error;
        if (profileemail == "" || profileemail == null || profileemail == undefined){
            res.render("doctor",{read:data,data:"",logpro:"none",logdis:"",occupation:""})
        }
        else {
            res.render("doctor",{read:data,data:logdata[0],logpro:"",logdis:"none",occupation:occup})
        }
    })
})

router.post("/search",function(req,res){
    DoctorBasicInfoModel.find({$or:[
        {name:{ $regex: new RegExp(req.body.info, "i"),}},
        {specialist:{$regex: new RegExp(req.body.info, "i")}},
        {service:{$regex: new RegExp(req.body.info, "i")}},
        {education:{$regex: new RegExp(req.body.info, "i")}}
        ]},{
            _id:0,
            _v:0
    },
    function(err,data){
        if (err) throw error;
        if(data == null || data == ""){
            res.render("search",{read:data,data:"",logpro:"none",logdis:"",srdisp:"",search:req.body.info,occupation:""})
        }
        else if (profileemail == "" || profileemail == null || profileemail == undefined){
            res.render("search",{read:data,data:"",logpro:"none",logdis:"",srdisp:"none",search:req.body.info,occupation:""})
        }
        else{
            res.render("search",{read:data,data:logdata[0],logpro:"",logdis:"none",srdisp:"none",search:req.body.info,occupation:occup})
        }
    }) 
})

router.get("/logout",(req,res)=>{
    profileemail="";
    occupation=""
    res.redirect("/login")
})

router.get("/login",(req,res)=>{
    dispmsg="none";
    dispdrmsg="none";
    res.render("login",{disp:display})
})

// Patient Register
router.get("/register",(req,res)=>{
    display="none";
    dispdrmsg="none";
    res.render("register",{dispmsg:dispmsg})
})

router.post("/patient-register",(req,res)=>{
    SignPatientModel=myDBsign.model("patient",signschema);
    var filter_email=SignPatientModel.find({email:req.body.email.trim()})
        filter_email.exec(function(err,data){
            if (err) throw error;
            if (data=="" || data==null || data==undefined){
                var reg=new SignPatientModel({
                    name:req.body.name,
                    email:req.body.email.trim(),
                    password:req.body.password
                }) 
                reg.save(function(){
                    imagename=req.body.email.trim();
                    pname=req.body.name;
                    res.render("patient-profile-settings",{name:req.body.name,email:req.body.email})
                });
            }
            else{
                dispmsg=" ";
                res.redirect('/register');
            }
        })
})

// Doctor Register
router.get("/doctor-register",(req,res)=>{
    display="none";
    dispmsg="none";
    res.render("doctor-register",{dispdrmsg:dispdrmsg})
})
router.post("/doctor-register",(req,res)=>{
    SignDoctorModel=myDBsign.model("doctor",signschema);
    var filter_email=SignDoctorModel.find({email:req.body.email.trim()})
        filter_email.exec(function(err,data){
            if (err) throw error;
            if (data=="" || data==null || data==undefined){
                var reg=new SignDoctorModel({
                    name:req.body.name,
                    email:req.body.email.trim(),
                    password:req.body.password
                }) 
                reg.save(function(){
                    imagename=req.body.email.trim();
                    res.render("doctor-profile-settings",{name:req.body.name,email:req.body.email})
                });
            }
            else{
                dispdrmsg:"";
                res.redirect('/doctor-register');
            }
        })
})

// Middleware For check if incorrect password or email its back to th login page with msg
var validation=function(req,res,next){
    signmodel=myDBsign.model(req.body.occupation,signschema);
        var para={$and:[{email:req.body.email.trim()},{password:req.body.password.trim()}]}
        var filter=signmodel.find(para)
        filter.exec(function(err,data){
            if (err) throw error;
            if (data==""){
                display="";
                res.redirect('/login');
            }
            else{
                imagename=req.body.email.trim();
                profileemail=req.body.email;
                occupation=req.body.occupation;
                if(occupation == "doctor"){
                    var filter_doctor_info=DoctorBasicInfoModel.find({email:profileemail});
                    filter_doctor_info.exec(function(err,data){
                        logdata=data;
                        occup="Doctor";
                        display="none";
                        next()
                    })
                }
                else{
                    var filter_patient_info=PatientBasicInfoModel.find({email:profileemail}); 
                    filter_patient_info.exec(function(err,data){
                        logdata=data;
                        occup="Patient";
                        display="none";
                        next()
                    })
                }
            }
        })
}
router.post("/user_profile",validation,(req,res)=>{
    res.redirect("/profile/"+logdata[0].name)
})

// Dashboar both for patient and Doctor
router.get("/profile/:drname",(req,res)=>{
    if(occupation=="doctor"){
        var TempappDrModel=TempappDr.model(logdata[0].name,appoint_schema);
        TempappDrModel.countDocuments({condition:"accept"},function(err,count){
            if(err) throw error;
            TempappDrModel.countDocuments({$and:[{date:today},{condition:"accept"}]},function(err,counttoday){
                if(err) throw error;
                var filter_appointment=TempappDrModel.find({condition:"non"});
                filter_appointment.exec(function(err,dataapptoinment){
                    if (err) throw error;
                    res.render("doctor-dashboard",{data:logdata[0],datapat:dataapptoinment,count:count,counttoday:counttoday,occupation:occup})
                })
            })
        })
    }
    else if(occupation=="patient"){
        var PatModel=TempappPat.model(profileemail,appoint_schema);
        var filter_appointment=PatModel.find({condition:"accept"});
        filter_appointment.exec(function(err,dataappt){
            if (err) throw error;
            var filter_today_appointment=PatModel.find({$and:[{date:today},{condition:"accept"}]});
            filter_today_appointment.exec(function(err,datatodayappt){
                if (err) throw error;
                res.render("patient_profile",{data:logdata[0],datapat:dataappt,datatapp:datatodayappt,occupation:occup})
            })
        })
    }
    else{
        res.redirect("/");
    }
})


// Doctor profile for patient view
router.get("/doctor-profile/:drname",(req,res)=>{
   var filter_doctor_info=DoctorBasicInfoModel.find({name:req.params.drname})
    var TempappDrModel=TempappDr.model(req.params.drname,appoint_schema);
    TempappDrModel.countDocuments({condition:"accept"},function(err,count){
        if(err) throw error;
        TempappDrModel.countDocuments({$and:[{date:today},{condition:"accept"}]},function(err,counttoday){
            filter_doctor_info.exec(function(err,data){
                if (err) throw error;
                if (profileemail == "" || profileemail == null || profileemail == undefined){
                    res.render("doctor-profile",{data:data[0],datap:"",count:count,counttoday:counttoday,logpro:"none",logdis:"",occupation:""})
                }
                else{
                    res.render("doctor-profile",{data:data[0],datap:logdata[0],count:count,counttoday:counttoday,logpro:"",logdis:"none",occupation:occup})
                }
            })
        })
    })
})

// Change Password
router.get("/change-password/:name",(req,res)=>{
    if (profileemail == "" || profileemail == null || profileemail == undefined){
        res.render("doctor",{read:data,data:"",logpro:"none",logdis:"",occupation:""})
    }
    else if (occupation=="doctor"){
        res.render("change-password",{data:logdata[0],disdoc:"none",dispat:"",occupation:occup})
    }
    else{
        res.render("change-password",{data:logdata[0],dispat:"none",disdoc:"",occupation:occup})
    }
})

router.post("/change-password",(req,res)=>{
    DoctorsignModel=myDBsign.model("doctor",signschema);
    PatientsignModel=myDBsign.model("patient",signschema);
    if(occupation=="doctor"){
        console.log(req.body.email)
        var filter_doctor_sign=DoctorsignModel.findOneAndUpdate({email:req.body.email},{
            name:req.body.name, //Doctor Name
            email:req.body.email,
            password:req.body.new_password
        })
        filter_doctor_sign.exec(function(err){
            res.redirect("/profile/"+req.body.name)
        });
    }
    else{
        var filter_pat=PatientsignModel.findOneAndUpdate({email:req.body.email},{
            name:req.body.name,
            email:req.body.email,
            password:req.body.new_password
        })
        filter_pat.exec(function(err){
            res.redirect("/profile/"+req.body.name)
            });
    }
})

// Office Shedule timing that only Doctor can set
router.get("/schedule-timings/:drname",(req,res)=>{
    if(occupation=="doctor"){
        DoctorSheduleDayModel=DrSheduleTime.model(req.params.drname,doctor_day_vise_shedule_schema);
        
        var filter_doctor_info=DoctorBasicInfoModel.find({name:req.params.drname})
        var filter_mon=DoctorSheduleDayModel.find({day:"Monday"})
        var filter_tue=DoctorSheduleDayModel.find({day:"Tuesday"})
        var filter_wed=DoctorSheduleDayModel.find({day:"Wednesday"})
        var filter_thu=DoctorSheduleDayModel.find({day:"Thursday"})
        var filter_fri=DoctorSheduleDayModel.find({day:"Friday"})
        var filter_sat=DoctorSheduleDayModel.find({day:"Saturday"})
        var filter_sun=DoctorSheduleDayModel.find({day:"Sunday"})

        filter_mon.exec(function(err,datamon){
            if (err) throw error;
            filter_tue.exec(function(err,datatue){
                if (err) throw error;
                filter_wed.exec(function(err,datawed){
                    if (err) throw error;
                    filter_thu.exec(function(err,datathu){
                        if (err) throw error;
                        filter_fri.exec(function(err,datafri){
                            if (err) throw error;
                            filter_sat.exec(function(err,datasat){
                                if (err) throw error;
                                filter_sun.exec(function(err,datasun){
                                    if (err) throw error;
                                        res.render("schedule-timings",{data:logdata[0],
                                            mon:datamon,tue:datatue,wed:datawed,thu:datathu,fri:datafri,sat:datasat,sun:datasun,occupation:"Doctor"})
                                })
                            })
                        })
                    })
                })
            })
        })
    }
    else{
    res.redirect("/");}
})
router.get("/schedule-timings/delete_schedule/:drname",(req,res)=>{
    var drinfo=req.params.drname;
    var drarry=drinfo.split("_");
    var day=drarry[0];
    var time=drarry[1];
    var dnam=drarry[2];
    DoctorSheduleDayModel=DrSheduleTime.model(dnam,doctor_day_vise_shedule_schema);
    
    var del=DoctorSheduleDayModel.findOneAndDelete({$and:[{day:day},{t:time}]});
        del.exec(function(err){
            if (err) throw error;
            res.redirect("/schedule-timings/"+dnam)
        })
})
router.post("/schedule-timings/add_schedule/:drname",(req,res)=>{
    DoctorSheduleDayModel=DrSheduleTime.model(req.params.drname,doctor_day_vise_shedule_schema);
    var time=req.body.shour+":"+req.body.smin +" "+ req.body.sfor + " - " + req.body.ehour+":"+req.body.emin +" "+ req.body.efor;
    var newtime= new DoctorSheduleDayModel({
        day:req.body.day,
        t:time
    });
    newtime.save(function(){
        res.redirect("/schedule-timings/"+req.params.drname)
    })
})

// Appointment section
router.get("/appointment/view_details/:email",(req,res)=>{
    if(occupation=="doctor"){
        var pm_history=PMhistory.model(req.params.email,patient_medical_history_schema);
        var filter_pm_history=pm_history.find();
        var filter_patient_info=PatientBasicInfoModel.find({email:req.params.email});
        filter_patient_info.exec(function(err,datapatient){
            if (err) throw error;
            var TempappDrModel=TempappDr.model(logdata[0].name,appoint_schema);
            var filter_appointment=TempappDrModel.find({email:req.params.email});;
            filter_appointment.exec(function(err,dataapptpay){
                if (err) throw error;
                filter_pm_history.exec(function(err,datahis){
                    if (err) throw error;
                    res.render("patient_details",{pat:datapatient[0],data:logdata[0],pay:dataapptpay[0],datahis:datahis,occupation:occup})
                })
            })
        })
    }
    else{
        res.redirect("/")
    }
})
router.post("/appointment/accept",(req,res)=>{
    var DrModel=TempappDr.model(req.body.doctor,appoint_schema);
    var rand=Math.floor(Math.random() * 10000000);
    var vl=req.body.name.substring(0,3)+rand+req.body.doctor.substring(0,3);

    var PatModel=TempappPat.model(req.body.email,appoint_schema);
    var filterpatandup=DrModel.findOneAndUpdate({email:req.body.email},{
            name:req.body.name, //Patient Name
            email:req.body.email,
            patient_image:req.body.patient_image,
            ac_type: req.body.ac_type,
            account_no: req.body.account_no,
            trx:req.body.trx,
            date:req.body.date,
            time:req.body.time,
            image:req.body.image,
            condition:"accept",
            video_link:vl
        })
        filterpatandup.exec(function(err){
            var filterdrandup=PatModel.findOneAndUpdate({name:req.body.doctor},{
                    name:req.body.doctor, //Doctor Name
                    patient_image:req.body.doctor_image,
                    ac_type: req.body.ac_type,
                    account_no: req.body.account_no,
                    trx:req.body.trx,
                    date:req.body.date,
                    time:req.body.time,
                    image:req.body.image,
                    condition:"accept",
                    video_link:vl
                })
                filterdrandup.exec(function(err){
                    res.redirect("/profile/"+req.body.doctor)
                })
        })           
})
router.post("/appointment/cancel",(req,res)=>{
    var DrModel=TempappDr.model(req.body.doctor,appoint_schema);
    DoctorSheduleModel=DrShedule.model(req.body.doctor,doctor_shedule_schema);
    var filter_doctor_time=DoctorSheduleModel.findOneAndDelete({$and:[{date:req.body.day},{time:req.body.time}]})
    var PatModel=TempappPat.model(req.body.email,appoint_schema);
    var filterdrandup=PatModel.findOneAndUpdate({name:req.body.doctor},{
        name:req.body.doctor, //Doctor Name
        patient_image:req.body.doctor_image,
        ac_type: req.body.ac_type,
        account_no: req.body.account_no,
        trx:req.body.trx,
        date:req.body.date,
        time:req.body.time,
        image:req.body.image,
        condition:"reject",
        video_link:""
    })
    filterdrandup.exec(function(err){
        var delete_data=DrModel.findOneAndDelete({email:req.body.email});
        delete_data.exec(function(){
            filter_doctor_time.exec()
        });
        res.redirect("/profile/"+req.body.doctor)
    })
})

router.get("/appoint/:info",(req,res)=>{
    var nmoc=req.params.info;
    var split=nmoc.split("__");
    var name=split[0];
    var email=split[1];
    var occ=split[2];
    profileemail=email;
    if(occ == "Doctor"){
        occupation="doctor"
        res.redirect("/appointment/"+name)
    }
    else{
        occupation="patient"
        res.redirect("/profile/"+name)
    }
})
router.get("/appointment/:name",(req,res)=>{
    if (profileemail == "" || profileemail == null || profileemail == undefined){
        res.redirect("/")
    }
    else if(occupation=="doctor"){
        var TempappDrModel=TempappDr.model(req.params.name,appoint_schema);
        var filter_appointment=TempappDrModel.find({condition:"accept"});
        filter_appointment.exec(function(err,dataappt){
            if (err) throw error;
            var filter_appointment=TempappDrModel.find({$and:[{date:today},{condition:"accept"}]});
            filter_appointment.exec(function(err,datatodayappt){
                if (err) throw error;
                res.render("appointment",{data:logdata[0],datapat:dataappt,datatapp:datatodayappt,occupation:occup})
            })
        })
    }
})

router.get("/patient_reject_appointment/:email",(req,res)=>{
    if (occupation == "patient"){
        var PatModel=TempappPat.model(req.params.email,appoint_schema);
        var filter_appointment=PatModel.find({condition:"reject"});
        filter_appointment.exec(function(err,dataappt){
            if (err) throw error;
            res.render("patient_rejected_appointment",{data:logdata[0],datapat:dataappt,occupation:occup})
        })
    }
})
router.get("/patient_pending_appointment/:email",(req,res)=>{
    if(occupation=="patient"){
        var PatModel=TempappPat.model(req.params.email,appoint_schema);
        var filter_appointment=PatModel.find({condition:"non"});
        filter_appointment.exec(function(err,dataappt){
            if (err) throw error;
            res.render("patient_pending_appointment",{data:logdata[0],datapat:dataappt,occupation:occup})
        })
    }
})



// Patient Medical Historry
router.get("/medical_history/:email",(req,res)=>{
    if(occupation == "patient"){
        var pm_history=PMhistory.model(req.params.email,patient_medical_history_schema);
        var filter_pm_history=pm_history.find();
        filter_pm_history.exec(function(err,datahis){
            res.render("patient_medical_history",{data:logdata[0],datahis:datahis,occupation:"Patient"})
        })
    }
})

router.post("/medical_history/add/:email",(req,res)=>{
    var date=req.body.day+"/"+req.body.month+"/"+req.body.year;
    var pm_history=PMhistory.model(req.params.email,patient_medical_history_schema);
    var newhistory= new pm_history({
        disease_name:req.body.disease_name,
        disease_duration:req.body.disease_duration,
        disease_date:date
    });
    newhistory.save(function(){
        res.redirect("/medical_history/"+req.params.email)
    })
})

router.get("/booking/:drname",(req,res)=>{
    var day1,day2,day3,day4,day5,day6,day7

    var today = new Date();
	var dd1 = String(today.getDate()).padStart(2, '0');
	var mm1 = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	var yyyy = today.getFullYear();
	
    var dd2 = String(today.getDate() + 1).padStart(2, '0');
	var mm2 = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!

    var dd3 = String(today.getDate()+2).padStart(2, '0');
	var mm3 = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!

    var dd4 = String(today.getDate()+3).padStart(2, '0');
	var mm4 = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!

    var dd5 = String(today.getDate()+4).padStart(2, '0');
	var mm5 = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!

    var dd6 = String(today.getDate()+5).padStart(2, '0');
	var mm6 = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!

    var dd7 = String(today.getDate()+6).padStart(2, '0');
	var mm7 = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!

    day1 = dd1 + '/' + mm1 + '/' + yyyy;
    day2 = dd2 + '/' + mm2 + '/' + yyyy;
    day3 = dd3 + '/' + mm3 + '/' + yyyy;
    day4 = dd4 + '/' + mm4 + '/' + yyyy;
    day5 = dd5 + '/' + mm5 + '/' + yyyy;
    day6 = dd6 + '/' + mm6 + '/' + yyyy;
    day7 = dd7 + '/' + mm7 + '/' + yyyy;

    DoctorSheduleModel=DrShedule.model(req.params.drname,doctor_shedule_schema);
    DoctorSheduleDayModel=DrSheduleTime.model(req.params.drname,doctor_day_vise_shedule_schema);

    var filter_doctor_info=DoctorBasicInfoModel.find({name:req.params.drname})

    var filter_mon=DoctorSheduleDayModel.find({day:"Monday"})
    var filter_tue=DoctorSheduleDayModel.find({day:"Tuesday"})
    var filter_wed=DoctorSheduleDayModel.find({day:"Wednesday"})
    var filter_thu=DoctorSheduleDayModel.find({day:"Thursday"})
    var filter_fri=DoctorSheduleDayModel.find({day:"Friday"})
    var filter_sat=DoctorSheduleDayModel.find({day:"Saturday"})
    var filter_sun=DoctorSheduleDayModel.find({day:"Sunday"})
    
    var filter_doctor_time1=DoctorSheduleModel.find({date:day1})
    var filter_doctor_time2=DoctorSheduleModel.find({date:day2})
    var filter_doctor_time3=DoctorSheduleModel.find({date:day3})
    var filter_doctor_time4=DoctorSheduleModel.find({date:day4})
    var filter_doctor_time5=DoctorSheduleModel.find({date:day5})
    var filter_doctor_time6=DoctorSheduleModel.find({date:day6})
    var filter_doctor_time7=DoctorSheduleModel.find({date:day7})
        filter_doctor_time1.exec(function(err,data1){
            if (err) throw error;
            filter_doctor_time2.exec(function(err,data2){
                if (err) throw error;
                filter_doctor_time3.exec(function(err,data3){
                    if (err) throw error;
                    filter_doctor_time4.exec(function(err,data4){
                        if (err) throw error;
                        filter_doctor_time5.exec(function(err,data5){
                            if (err) throw error;
                            filter_doctor_time6.exec(function(err,data6){
                                if (err) throw error;
                                filter_doctor_time7.exec(function(err,data7){
                                    if (err) throw error;
                                    filter_doctor_info.exec(function(err,datadr){
                                        if (err) throw error;
                                        filter_mon.exec(function(err,datamon){
                                            if (err) throw error;
                                            filter_tue.exec(function(err,datatue){
                                                if (err) throw error;
                                                filter_wed.exec(function(err,datawed){
                                                    if (err) throw error;
                                                    filter_thu.exec(function(err,datathu){
                                                        if (err) throw error;
                                                        filter_fri.exec(function(err,datafri){
                                                            if (err) throw error;
                                                            filter_sat.exec(function(err,datasat){
                                                                if (err) throw error;
                                                                filter_sun.exec(function(err,datasun){
                                                                    if (err) throw error;
                                                                    if (profileemail == "" || profileemail == null || profileemail == undefined){
                                                                        res.render("booking",{datadr:datadr[0],
                                                                            read1:data1,read2:data2,read3:data3,read4:data4,read5:data5,read6:data6,read7:data7,
                                                                            mon:datamon,tue:datatue,wed:datawed,thu:datathu,fri:datafri,sat:datasat,sun:datasun,
                                                                            data:"",logpro:"none",logdis:"",occupation:""})
                                                                    }
                                                                    else{
                                                                        res.render("booking",{datadr:datadr[0],
                                                                            read1:data1,read2:data2,read3:data3,read4:data4,read5:data5,read6:data6,read7:data7,
                                                                            mon:datamon,tue:datatue,wed:datawed,thu:datathu,fri:datafri,sat:datasat,sun:datasun,
                                                                            data:logdata[0],logpro:"",logdis:"none",occupation:occup})
                                                                    }
                                                                })
                                                            })
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })

router.get("/checkout/:drname",(req,res)=>{
    
    if (profileemail == "" || profileemail == null || profileemail == undefined){
        res.render("checkout",{dr:req.params.drname,data:"",logpro:"none",logdis:"",mssg:"Please Before Login then Booking",occupation:""})
    }
    else if(occupation=="doctor"){
        res.render("checkout",{dr:req.params.drname,data:"",logpro:"none",logdis:"",mssg:"Please Login as a Patient",occupation:"Doctor"})
    }
    else{
        res.render("checkout",{dr:req.params.drname,data:logdata[0],logpro:"",logdis:"none",mssg:"",occupation:"Patient"}) 
    }
})
var t;
router.post("/payment",function(req,res){
    t=0;
    var date=req.body.day+"/"+req.body.month +"/"+ req.body.year;
    var time=req.body.hour+":"+req.body.min +" "+ req.body.for;
    var filter_doctor_info=DoctorBasicInfoModel.find({name:req.body.doctor});
    filter_doctor_info.exec(function(err,datadr){
        if(err) throw error;
            res.render("payment",{data:logdata[0],date:date,datadr:datadr[0],time:time,occupation:"Patient"})
    })
})

// for file upload
var Storage=multer.diskStorage({
    destination:"./public/reciepts/",
    filename:(req,file,cb)=>{
        cb(null,"recepts"+ '-' + Date.now()+path.extname(file.originalname))
    }
})
var upload=multer({
    storage:Storage
}).single('receipt');

router.post("/thanks",upload,function(req,res){  
    var DoctorSheduleModel=DrShedule.model(req.body.doctor,doctor_shedule_schema);
    var TempappDrModel=TempappDr.model(req.body.doctor,appoint_schema);
    var TempappPaModel=TempappPat.model(req.body.email,appoint_schema);
        if(t==0){
            const new_time = new DoctorSheduleModel({
                date:req.body.date,
                time:req.body.time
            })
            new_time.save(function(){
                const new_appointment=new TempappDrModel({
                    name:req.body.name, // Patient  name
                    email:req.body.email,
                    patient_image:req.body.image,
                    ac_type: req.body.ac_type,
                    account_no: req.body.account_no,
                    trx:req.body.trx,
                    date:req.body.date,
                    time:req.body.time,
                    condition:"non",
                    image:req.file.filename
                })
                new_appointment.save(function(){
                    const new_appointment2=new TempappPaModel({
                        name:req.body.doctor, // Doctor name
                        email:req.body.email,
                        patient_image:req.body.drimage,
                        ac_type: req.body.ac_type,
                        account_no: req.body.account_no,
                        trx:req.body.trx,
                        date:req.body.date,
                        time:req.body.time,
                        condition:"non",
                        image:req.file.filename
                    })
                    t++;
                    new_appointment2.save(function(){
                       res.render("booking-success",{dr:req.body.doctor,data:logdata[0],date:req.body.date,time:req.body.time,occupation:"Patient"}) 
                    })
                })
            })
        }
})

// for file upload
var Storage=multer.diskStorage({
    destination:"./public/user_images/",
    filename:(req,file,cb)=>{
        cb(null,imagename+path.extname(file.originalname))
    }
})
var upload=multer({
    storage:Storage
}).single('file');

// save Doctor Information in DB
router.post("/doctor-basic-information",upload,(req,res)=>{
    var reg=new DoctorBasicInfoModel({
        name:req.body.name,
        email:req.body.email.trim(),
        image:req.file.filename,
        firstname: req.body.firstname,
        lastname:req.body.lastname,
        gender:req.body.gender,
        phone_no:req.body.phone_no,
        date_of_birth:req.body.date_of_birth,
        biography:req.body.biography,
        clinic_name:req.body.clinic_name,
        clinic_address:req.body.clinic_address,
        price:req.body.price,
        service:req.body.service,
        specialist:req.body.specialist,
        education:req.body.education,
        hospital_name:req.body.hospital_name,
        from:req.body.from,
        to:req.body.to,
        awards:req.body.awards,
        ep_ac_no:req.body.ep_ac_no,
        ep_ac_name:req.body.ep_ac_name,
        jc_ac_no:req.body.jc_ac_no,
        jc_ac_name:req.body.jc_ac_name
    }) 
    reg.save(function(){
        res.redirect('/login');
    });
})

// Update Doctor Profile
router.get("/doctor-profile-setting/:drname",(req,res)=>{
    if(occupation=="doctor"){
        var filter_doctor_info=DoctorBasicInfoModel.find({name:req.params.drname})
        filter_doctor_info.exec(function(err,data){
            if (err) throw error;
            res.render("doctor-profile-setting-update",{data:data[0],occupation:"Doctor"})
        })
    }
})

router.post("/doctor-profile-setting",upload,(req,res)=>{
    var biography;
    if (req.body.biography2 == "" ){
        biography = req.body.biography1;
    }
    else{
        biography = req.body.biography2;
    }
    if(req.file.filename.split(".")[2] !== req.body.img.split(".")[2]){
        fs.unlinkSync(path.join(__dirname, '../public/user_images/'+req.body.img));
    }
    
    
    var filter_details_update=DoctorBasicInfoModel.findOneAndUpdate({email:req.body.email},{
    name:req.body.name,
    email:req.body.email.trim(),
    image:req.file.filename,
    firstname: req.body.firstname,
    lastname:req.body.lastname,
    gender:req.body.gender,
    phone_no:req.body.phone_no,
    date_of_birth:req.body.date_of_birth,
    biography:biography,
    clinic_name:req.body.clinic_name,
    clinic_address:req.body.clinic_address,
    price:req.body.price,
    service:req.body.service,
    specialist:req.body.specialist,
    education:req.body.education,
    hospital_name:req.body.hospital_name,
    from:req.body.from,
    to:req.body.to,
    awards:req.body.awards,
    ep_ac_no:req.body.ep_ac_no,
    ep_ac_name:req.body.ep_ac_name,
    jc_ac_no:req.body.jc_ac_no,
    jc_ac_name:req.body.jc_ac_name
}) 
filter_details_update.exec(function(err){
    res.redirect("/doctor-profile-setting/"+req.body.name)
});
})


// save Patient Information In DB
router.post("/patient-basic-information",upload,(req,res)=>{
    var reg=new PatientBasicInfoModel({
        name:req.body.name,
        email:req.body.email.trim(),
        image:req.file.filename,
        gender:req.body.gender,
        phone_no:req.body.phone_no,
        blood_group:req.body.blood_group,
        age:req.body.age,
        date_of_birth:req.body.date_of_birth,
        address:req.body.address
    }) 
    reg.save(function(){
        res.redirect('/login');
    });
})

// Update Patient Profile
router.get("/patient-profile-setting/:email",(req,res)=>{
    if (occupation=="patient"){
        var filter_patient_info=PatientBasicInfoModel.find({email:req.params.email});
        filter_patient_info.exec(function(err,data){
            if (err) throw error;
            res.render("patient-profile-setting-update",{data:data[0],occupation:"Patient"})
        })
    }
})
router.post("/patient-profile-setting",upload,(req,res)=>{
    if(req.file.filename.split(".")[2] !== req.body.img.split(".")[2]){
        fs.unlinkSync(path.join(__dirname, '../public/user_images/'+req.body.img));
    }
    var filter_details_update=PatientBasicInfoModel.findOneAndUpdate({email:req.body.email},{
        name:req.body.name,
        email:req.body.email.trim(),
        image:req.file.filename,
        gender:req.body.gender,
        phone_no:req.body.phone_no,
        blood_group:req.body.blood_group,
        age:req.body.age,
        date_of_birth:req.body.date_of_birth,
        address:req.body.address
    }) 
    filter_details_update.exec(function(err){
        res.redirect("/patient-profile-setting/"+req.body.email)
    });
})


module.exports=router;