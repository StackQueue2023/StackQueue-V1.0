const express=require('express');
const { default: mongoose } = require('mongoose');
const app=express();
const cors=require('cors');
const bodyparse=require('body-parser');
const nodemailer=require("nodemailer");
const fs = require('fs');
const path = require('path');
app.use(cors({origin:"*"}));
// Increase payload limit
app.use(bodyparse.json({ limit: '10mb' })); // Adjust the limit as needed
app.use(bodyparse.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());
const url='mongodb+srv://STACK_QUEUE:Stackqueue%402023@stackqueuecluster.wfarxbd.mongodb.net/StackQueueOfficial';

mongoose.connect(url).then(()=>{
    app.listen(3001,()=>{
        console.log("Connected");
    })
}).catch(err => {
    console.error("Error connecting to MongoDB:", err);
});

app.post("/contactUs",async(req,res)=>{
    await mongoose.connection.collection('contactUs').insertOne(req.body).then((post)=>{
        console.log("post");
        console.log(req.body);
        sendContactMail(req.body, (err, info) => {
            if (err) {
                console.error("Error sending email:", err);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        res.send(post);
    })
})
            
 
// Define the schema and model for job profiles
const jobProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  position: { type: String, required: true },
  experience: { type: String, required: true },
  resume: { type: String, required: true }, // Store Base64 string
});


const JobProfile = mongoose.model('JobProfile', jobProfileSchema);

// Endpoint to post job profile
app.post("/postJobProfile", async (req, res) => {
    console.log(req.body);
    
    try {
        const { name, email, phone, position, experience, resume } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !position || !experience || !resume) {
            return res.status(400).send({ error: "All fields are required." });
        }

        // Ensure resume is a Base64 string
        if (typeof resume !== 'string') {
            return res.status(400).send({ error: "Resume must be a Base64 encoded string." });
        }

        // Create and save the job profile
        const newJobProfile = new JobProfile({
            name,
            email,
            position,
            phone,
            experience,
            resume
        });

        const savedJobProfile = await newJobProfile.save();

        // Send email with job profile details
        sendJobProfileMail(savedJobProfile, (err, info) => {
            if (err) {
                console.error("Error sending job profile email:", err);
            } else {
                console.log("Job profile email sent:", info);
            }
        });

        res.status(201).send(savedJobProfile);
    } catch (err) {
        console.error("Error saving job profile:", err);
        res.status(500).send({ error: "An error occurred while saving the job profile." });
    }
});



async function sendJobProfileMail(jobProfile, callback) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: "stackqueue2023@gmail.com",
            pass: "mxjiidnczarbqrrn"
        }
    });

    // Parse the Base64 string for email attachment
    const base64Data = jobProfile.resume.split(';base64,').pop();

    const mailOptions = {
        from: "stackqueue2023@gmail.com",
        to: "stackqueue2023@gmail.com",
        subject: `New Job Application for ${jobProfile.position}`,
        html: `
            <div style="padding: 20px; background: #f9f9f9; font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #2b2b2b; text-align: center;">New Job Application</h2>
                    <p>A new job application has been submitted. The details are as follows:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr><td><b>Name:</b></td><td>${jobProfile.name}</td></tr>
                        <tr><td><b>Email:</b></td><td>${jobProfile.email}</td></tr>
                        <tr><td><b>Phone Number:</b></td><td>${jobProfile.phone}</td></tr>
                        <tr><td><b>Position:</b></td><td>${jobProfile.position}</td></tr>
                        <tr><td><b>Experience:</b></td><td>${jobProfile.experience}</td></tr>
                    </table>
                    <p>Resume is attached to this email.</p>
                </div>
            </div>
        `,
        attachments: [
            {
                filename: `resume_${jobProfile.name}.pdf`,
                content: base64Data,
                encoding: 'base64',
            },
        ],
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error("Error sending email:", err);
            callback(err, null);
        } else {
            console.log("Email sent: " + info.response);
            callback(null, info.response);
        }
    });
}


async function sendContactMail(user, callback) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: "stackqueue2023@gmail.com",
            pass: "mxjiidnczarbqrrn"
        }
    });

    const mailoptions = {
        from: user.email,
        to: "stackqueue2023@gmail.com",
        subject: `New Contact Inquiry from ${user.name}`,
        html: `
            <div style="padding: 20px; background: #f9f9f9; font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #2b2b2b; text-align: center;">New Contact Inquiry</h2>
                    <p style="margin-bottom: 15px;">
                        You have received a new inquiry from your website contact form. The details are as follows:
                    </p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Name:</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email:</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Phone Number:</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.number}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Message:</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.message}</td>
                        </tr>
                    </table>
                    <p style="margin-bottom: 20px;">
                        Please respond to this inquiry at your earliest convenience.
                    </p>
                    <p style="margin-top: 20px; text-align: center; font-style: italic; color: #666;">
                        <b>STACK QUEUE EDUCATION</b><br>
                        Salem, Tamil Nadu<br>
                        Email: stackqueueeducation@stackqueue.in | Phone: +91 7305370425
                    </p>
                </div>
            </div>
        `
    };

    transporter.sendMail(mailoptions, function (err, info) {
        if (err) {
            console.error("Error sending email:", err);
            callback(err, null);
        } else {
            console.log('Email sent: ' + info.response);
            callback(null, info.response);
        }
    });
}

app.post("/postEnquiry",async(req, res)=>{
    console.log(req.body);
    let user=req.body;
    await mongoose.connection.collection('enquiry').insertOne(req.body).then((register)=>{
        res.send(register);
    })
    enquiryMailToAdmin(user,(err,info)=>{
        if(err){
            console.log(err);
        }
        else{
        console.log("Email sent successfully");
        res.send(info);
        }
    });
})
async function enquiryMailToAdmin(user, callback) {
    
    // Create transporter for Gmail
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: "stackqueue2023@gmail.com",
            pass: "mxjiidnczarbqrrn"
        }
    });

    // Email to the customer
    const customerMailOptions = {
        from: "stackqueue2023@gmail.com",
        to: user.email,
        subject: 'Thank You for Your Interest in STACK QUEUE EDUCATION Course Enquiry',
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://live.staticflickr.com/65535/53616390354_4f13eda2e9_z.jpg" alt="STACK QUEUE EDUCATION" style="width: 180px; height: auto;">
                </div>
                
                <h2 style="color: #333; text-align: center; font-size: 22px; margin-bottom: 20px;">Thank You for Your Interest in STACK QUEUE EDUCATION</h2>

                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    Dear <b>${user.name}</b>,<br><br>
                    Thank you for your inquiry about our courses at <b>STACK QUEUE EDUCATION</b>. We are pleased to learn about your interest in enhancing your skills through our cutting-edge educational programs.<br><br>

                    We offer top-tier training in various future technologies, and we’re confident that our courses such as <b>${user.course}</b> will equip you with the knowledge necessary to succeed in today's fast-paced tech environment.<br><br>

                    Should you need any further information or assistance, feel free to reach out to us. We are always here to help you on your educational journey.<br><br>

                    We look forward to having you join us soon.<br><br>

                    Best regards,<br><br>

                    <b>STACK QUEUE EDUCATION</b><br>
                    Salem, Tamil Nadu<br>
                    Email: <a href="mailto:stackqueueeducation@stackqueue.in">stackqueueeducation@stackqueue.in</a><br>
                    Phone: +91 7305370425
                </p>

                <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                    This is an automated email. Please do not reply to this address.
                </p>
            </div>
        </div>`
    };

    // Email to the admin
    const adminMailOptions = {
        from: user.email,
        to: "stackqueue2023@gmail.com ", // Admin email
        subject: `New Enquiry from ${user.name} for ${user.course}`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #333; text-align: center; font-size: 22px;">New Course Enquiry</h2>

                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    Hello Admin,<br><br>
                    You have received a new enquiry from <b>${user.name}</b> for the course <b>${user.course}</b>.<br><br>

                    Here are the details:<br><br>
                    <b>Name:</b> ${user.name}<br>
                    <b>Email:</b> ${user.email}<br>
                    <b>Course Interested:</b> ${user.course}<br>
                    <b>Phone:</b> ${user.phone}<br><br>

                    Please follow up with the user as soon as possible.<br><br>

                    Best regards,<br>
                    <b>STACK QUEUE EDUCATION</b><br>
                    Salem, Tamil Nadu<br>
                    Email: <a href="mailto:stackqueueeducation@stackqueue.in">stackqueueeducation@stackqueue.in</a><br>
                    Phone: +91 7305370425
                </p>

                <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                    This is an automated email. Please do not reply to this address.
                </p>
            </div>
        </div>`
    };

    // Send emails to both customer and admin
    transporter.sendMail(customerMailOptions, function(err, info) {
        if (err) {
            console.error("Error sending email to customer:", err);
            callback(err, null);
        } else {
            console.log('Email sent to customer: ' + info.response);

            // After customer email is sent, send the email to admin
            transporter.sendMail(adminMailOptions, function(err, info) {
                if (err) {
                    console.error("Error sending email to admin:", err);
                    callback(err, null);
                } else {
                    console.log('Email sent to admin: ' + info.response);
                    callback(null, info.response);
                }
            });
        }
    });
}

app.get("/courses",async(req,res)=>{
    await mongoose.connection.collection('courses').find().toArray().then((data)=>{
        res.send(data);
    })
})


app.get("/internships",async(req,res)=>{
    await mongoose.connection.collection('internships').find().toArray().then((data)=>{
        res.send(data[0]);
    })
})

app.post("/postInternshipEnquiry", async (req, res) => {
    console.log(req.body);
    let user = req.body;
    const finalDuration = user.duration === 'others' ? user.otherDuration : user.duration;
    user.duration = finalDuration;

    await mongoose.connection.collection('internshipEnquiry').insertOne(user).then((register) => {
        res.send(register);
    });

    internshipEnquiryMail(user, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Email sent successfully");
            res.send(info);
        }
    });
});

async function internshipEnquiryMail(user, callback) {
    

    // Create transporter for Gmail
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: "stackqueue2023@gmail.com",
            pass: "mxjiidnczarbqrrn"
        }
    });

    // Email to the student
    const studentMailOptions = {
        from: "stackqueue2023@gmail.com",
        to: user.email,
        subject: 'Thank You for Your Internship Enquiry at STACK QUEUE EDUCATION',
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://live.staticflickr.com/65535/53616390354_4f13eda2e9_z.jpg" alt="STACK QUEUE EDUCATION" style="width: 180px; height: auto;">
                </div>
                
                <h2 style="color: #333; text-align: center; font-size: 22px; margin-bottom: 20px;">Thank You for Your Internship Enquiry</h2>

                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    Dear <b>${user.name}</b>,<br><br>
                    Thank you for your enquiry about our internship program at <b>STACK QUEUE EDUCATION</b>. We are pleased to learn about your interest in enhancing your skills through our internship program.<br><br>

                    We will review your enquiry and get back to you soon.<br><br>

                    Best regards,<br><br>

                    <b>STACK QUEUE EDUCATION</b><br>
                    Salem, Tamil Nadu<br>
                    Email: <a href="mailto:stackqueueeducation@stackqueue.in">stackqueueeducation@stackqueue.in</a><br>
                    Phone: +91 7305370425
                </p>

                <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                    This is an automated email. Please do not reply to this address.
                </p>
            </div>
        </div>`
    };

    // Email to the admin
    const adminMailOptions = {
        from: user.email,
        to: "stackqueue2023@gmail.com", // Admin email
        subject: `New Internship Enquiry from ${user.name}`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #333; text-align: center; font-size: 22px;">New Internship Enquiry</h2>

                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    Hello Admin,<br><br>
                    You have received a new internship enquiry from <b>${user.name}</b>.<br><br>

                    Here are the details:<br><br>
                    <b>Name:</b> ${user.name}<br>
                    <b>Email:</b> ${user.email}<br>
                    <b>Phone:</b> ${user.phone}<br>
                    <b>Location:</b> ${user.location}<br>
                    <b>Duration:</b> ${user.duration}<br>
                    <b>price:</b> ${user.price}<br><br>

                    Please follow up with the user as soon as possible.<br><br>

                    Best regards,<br>
                    <b>STACK QUEUE EDUCATION</b><br>
                    Salem, Tamil Nadu<br>
                    Email: <a href="mailto:stackqueueeducation@stackqueue.in">stackqueueeducation@stackqueue.in</a><br>
                    Phone: +91 7305370425
                </p>

                <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                    This is an automated email. Please do not reply to this address.
                </p>
            </div>
        </div>`
    };

    // Send emails to both student and admin
    transporter.sendMail(studentMailOptions, function (err, info) {
        if (err) {
            console.error("Error sending email to student:", err);
            callback(err, null);
        } else {
            console.log('Email sent to student: ' + info.response);

            // After student email is sent, send the email to admin
            transporter.sendMail(adminMailOptions, function (err, info) {
                if (err) {
                    console.error("Error sending email to admin:", err);
                    callback(err, null);
                } else {
                    console.log('Email sent to admin: ' + info.response);
                    callback(null, info.response);
                }
            });
        }
    });
}
