import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models import EmailLog, Application, Candidate, Job, Interview

logger = logging.getLogger("talentiq.email")


class EmailService:
    @classmethod
    def _build_html_template(
        cls,
        candidate_name: str,
        stage_badge: str,
        stage_color: str,
        headline: str,
        intro_paragraphs: List[str],
        cta_label: Optional[str] = None,
        cta_url: Optional[str] = None,
        key_details: Optional[Dict[str, str]] = None,
        guidelines: Optional[List[str]] = None,
        footer_note: Optional[str] = None,
    ) -> str:
        '''Premium editorial recruitment email renderer.'''

        intro_html = "".join(
            f'''<p style="margin:0 0 17px;font-size:15px;line-height:24px;color:#344054;">{p}</p>'''
            for p in intro_paragraphs
        )

        details_html = ""
        if key_details:
            rows = ""
            items = list(key_details.items())
            for index, (key, value) in enumerate(items):
                border = "" if index == len(items) - 1 else "border-bottom:1px solid #e7e9ed;"
                rows += f'''
                <tr>
                    <td width="34%" valign="top" style="padding:14px 18px 14px 0;{border}font-size:11px;line-height:17px;color:#667085;font-weight:700;text-transform:uppercase;letter-spacing:.055em;">{key}</td>
                    <td valign="top" style="padding:14px 0;{border}font-size:13px;line-height:19px;color:#172033;font-weight:700;word-break:break-word;">{value}</td>
                </tr>
                '''
            details_html = f'''
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:27px 0 25px;border-top:2px solid #172033;">{rows}</table>
            '''

        guidelines_html = ""
        if guidelines:
            items = ""
            for index, guideline in enumerate(guidelines, start=1):
                items += f'''
                <tr>
                    <td width="28" valign="top" style="padding:0 12px 13px 0;font-size:11px;line-height:18px;color:{stage_color};font-weight:800;">{index:02d}</td>
                    <td valign="top" style="padding:0 0 13px;font-size:13px;line-height:20px;color:#475467;">{guideline}</td>
                </tr>
                '''
            guidelines_html = f'''
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 2px;">
                <tr><td style="padding:0 0 11px;border-bottom:1px solid #e7e9ed;font-size:10px;line-height:14px;color:#667085;font-weight:800;text-transform:uppercase;letter-spacing:.11em;">What happens next</td></tr>
                <tr><td style="padding-top:16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">{items}</table></td></tr>
            </table>
            '''

        cta_html = ""
        if cta_label and cta_url:
            cta_html = f'''
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 9px;">
                <tr><td style="background:#172033;"><a href="{cta_url}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:12px;line-height:18px;font-weight:800;color:#ffffff;text-decoration:none;letter-spacing:.01em;">{cta_label} &nbsp;&nbsp;→</a></td></tr>
            </table>
            <div style="font-size:10px;line-height:16px;color:#98a2b3;">If the button does not work, use this link:<br><a href="{cta_url}" target="_blank" style="color:#475467;text-decoration:underline;word-break:break-all;">{cta_url}</a></div>
            '''

        footer_text = footer_note or "You are receiving this message because you applied for or progressed through a TalentIQ hiring process."
        year = datetime.now().year

        return f'''
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>{headline}</title>
</head>
<body style="margin:0;padding:0;background:#f1f3f5;font-family:Arial,Helvetica,sans-serif;color:#172033;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">{headline}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f3f5;">
<tr><td align="center" style="padding:42px 16px 48px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;background:#ffffff;">
<tr><td style="padding:27px 34px 25px;border-bottom:1px solid #e4e7ec;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle">
<div style="font-size:20px;line-height:24px;font-weight:800;letter-spacing:-.045em;color:#111827;">Talent<span style="color:{stage_color};">IQ</span></div>
<div style="padding-top:4px;font-size:9px;line-height:13px;color:#98a2b3;font-weight:700;text-transform:uppercase;letter-spacing:.13em;">Talent Acquisition</div>
</td>
<td align="right" valign="middle">
<div style="font-size:10px;line-height:15px;color:#667085;">Application</div>
<div style="padding-top:2px;font-size:10px;line-height:15px;color:#172033;font-weight:700;">{stage_badge}</div>
</td>
</tr></table>
</td></tr>
<tr><td style="height:4px;background:{stage_color};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:42px 52px 44px;">
<div style="font-size:10px;line-height:14px;font-weight:800;color:{stage_color};text-transform:uppercase;letter-spacing:.12em;">{stage_badge}</div>
<h1 style="margin:10px 0 21px;font-size:31px;line-height:38px;font-weight:800;letter-spacing:-.038em;color:#101828;">{headline}</h1>
<div style="width:42px;height:3px;background:{stage_color};margin:0 0 25px;font-size:0;line-height:0;">&nbsp;</div>
<p style="margin:0 0 17px;font-size:15px;line-height:24px;color:#172033;">Hello {candidate_name},</p>
{intro_html}
{details_html}
{guidelines_html}
{cta_html}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:31px;"><tr><td style="border-top:1px solid #e4e7ec;padding-top:18px;"><div style="font-size:12px;line-height:19px;color:#667085;">Best regards,</div><div style="font-size:12px;line-height:19px;font-weight:800;color:#172033;">TalentIQ Recruitment Team</div></td></tr></table>
</td></tr>
<tr><td style="border-top:1px solid #e4e7ec;background:#f8f9fa;padding:24px 34px 26px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="top" width="55%"><div style="font-size:12px;line-height:18px;font-weight:800;color:#172033;">TalentIQ</div><div style="padding-top:5px;font-size:10px;line-height:16px;color:#7b8493;">{footer_text}</div></td>
<td align="right" valign="top"><div style="font-size:10px;line-height:16px;color:#7b8493;">© {year} TalentIQ Inc.</div><div style="padding-top:2px;font-size:10px;line-height:16px;color:#98a2b3;">Automated recruitment communication</div></td>
</tr></table>
</td></tr>
</table>
<div style="max-width:680px;padding:14px 18px 0;font-size:9px;line-height:14px;color:#98a2b3;text-align:center;">Please keep this email for your records.</div>
</td></tr></table>
</body>
</html>
'''

    @classmethod
    def _dispatch_smtp(cls, recipient_email: str, recipient_name: str, subject: str, body_text: str, body_html: Optional[str] = None) -> bool:
        """
        Sends real email over SMTP (e.g. Gmail) supporting both rich HTML and plaintext fallback.
        """
        if not settings.SMTP_HOST or not settings.SMTP_USER:
            logger.info("SMTP_HOST or SMTP_USER not set. Email stored in TalentIQ logs only.")
            return False
            
        try:
            from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
            from_name = settings.SMTP_FROM_NAME or "TalentIQ Hiring Team"
            
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{from_name} <{from_email}>"
            msg["To"] = f"{recipient_name} <{recipient_email}>"
            msg["Subject"] = subject
            
            # Plain text part
            msg.attach(MIMEText(body_text, "plain", "utf-8"))
            
            # HTML part
            if body_html:
                msg.attach(MIMEText(body_html, "html", "utf-8"))
            
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_PASSWORD:
                clean_pwd = settings.SMTP_PASSWORD.replace(" ", "")
                server.login(settings.SMTP_USER, clean_pwd)
            server.sendmail(from_email, [recipient_email], msg.as_string())
            server.quit()
            logger.info(f"Email successfully delivered over SMTP to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"SMTP dispatch failed: {e}", exc_info=True)
            return False

    @classmethod
    def send_notification(
        cls,
        db: Session,
        application: Application,
        stage: str,
        custom_notes: Optional[str] = None,
        assessment_url: Optional[str] = None,
        meeting_link: Optional[str] = None,
        scheduled_at: Optional[datetime] = None,
        interviewer_name: Optional[str] = None,
        score: Optional[float] = None,
    ) -> Optional[EmailLog]:
        """
        Generates rich HTML and plaintext notifications, dispatches over SMTP, and logs into TalentIQ.
        """
        candidate = application.candidate
        job = application.job
        if not candidate or not job:
            return None
            
        name = candidate.full_name
        job_title = job.title
        email = candidate.email
        
        frontend_base = settings.FRONTEND_URL.rstrip("/")
        default_assessment_url = assessment_url or f"{frontend_base}/assessment/{application.id}"
        
        subject = ""
        template_name = ""
        body_text = ""
        body_html = ""
        
        if stage == "Applied":
            template_name = "application_received"
            subject = f"Application Confirmed: {job_title} at TalentIQ"
            
            intro_p = [
                f"Thank you for applying for the <strong>{job_title}</strong> role at TalentIQ. We have successfully received your credentials and uploaded resume.",
                "Our TalentIQ autonomous screening engine is currently analyzing your technical skills and background against the role requirements.",
                "You will receive an automated notification as soon as the initial review is concluded."
            ]
            
            body_text = (
                f"Dear {name},\n\n"
                f"Thank you for applying for the {job_title} position. "
                f"We have successfully received your application and resume. "
                f"Our TalentIQ AI-powered recruitment engine is reviewing your profile.\n\n"
                f"Best regards,\nTalentIQ Recruitment Team"
            )
            
            body_html = cls._build_html_template(
                candidate_name=name,
                stage_badge="Application Received",
                stage_color="#4f46e5",
                headline=f"We Have Received Your Application for {job_title}",
                intro_paragraphs=intro_p,
                key_details={
                    "Position": job_title,
                    "Application ID": application.id[:8].upper(),
                    "Review Status": "AI Screening In Progress",
                    "Expected Turnaround": "Instant / Within 24 Hours"
                },
                guidelines=[
                    "Keep an eye on your email for screening results and assessment invitations.",
                    "Ensure your spam filter allows messages from TalentIQ."
                ]
            )
            
        elif stage == "Shortlisted":
            template_name = "candidate_shortlisted"
            subject = f"Congratulations! You've been shortlisted for {job_title} at TalentIQ"
            
            match_pct = f"{application.match_score:.1f}%" if application.match_score else "Top 5%"
            
            intro_p = [
                f"Great news! After reviewing your technical credentials, our hiring panel and AI screening engine evaluated your profile at <strong>{match_pct} fit</strong> and you have been shortlisted for <strong>{job_title}</strong>!",
                "The next milestone in our zero-touch hiring pipeline is an objective online skills assessment tailored to this position."
            ]
            
            body_text = (
                f"Dear {name},\n\n"
                f"Congratulations! You've been shortlisted for {job_title} at TalentIQ ({match_pct} Match).\n\n"
                f"Next step: Online Technical Assessment.\n\n"
                f"Assessment Link: {default_assessment_url}\n\n"
                f"Best regards,\nTalentIQ Hiring Team"
            )
            
            body_html = cls._build_html_template(
                candidate_name=name,
                stage_badge="Candidate Shortlisted",
                stage_color="#0284c7",
                headline="You Have Been Shortlisted!",
                intro_paragraphs=intro_p,
                cta_label="View Assessment Overview",
                cta_url=default_assessment_url,
                key_details={
                    "Role": job_title,
                    "Screening Score": f"{match_pct} Match",
                    "Next Round": "Online Technical Assessment"
                }
            )
            
        elif stage == "Assessment":
            template_name = "assessment_invitation"
            subject = f"Action Required: Online Skill Assessment for {job_title} - TalentIQ"
            
            expiry_str = (datetime.now() + timedelta(hours=48)).strftime("%B %d, %Y at %I:%M %p")
            
            intro_p = [
                f"You have been officially invited to complete the <strong>{job_title}</strong> technical assessment.",
                "This assessment evaluates real-world problem-solving, architectural acumen, and domain knowledge. It is auto-graded instantly upon submission."
            ]
            
            body_text = (
                f"Dear {name},\n\n"
                f"You have been invited to complete the online skill assessment for {job_title}.\n\n"
                f"Take Test Link: {default_assessment_url}\n"
                f"Time Limit: 25-30 Minutes\n"
                f"Passing Threshold: 70%\n"
                f"Expiration: {expiry_str}\n\n"
                f"Guidelines:\n"
                f"- Please ensure a stable internet connection.\n"
                f"- The test is single-attempt with auto-evaluation.\n\n"
                f"Best of luck!\nTalentIQ Assessment Team"
            )
            
            body_html = cls._build_html_template(
                candidate_name=name,
                stage_badge="Assessment Invitation",
                stage_color="#d97706",
                headline=f"Online Technical Assessment: {job_title}",
                intro_paragraphs=intro_p,
                cta_label="🚀 Start Assessment Now",
                cta_url=default_assessment_url,
                key_details={
                    "Position": job_title,
                    "Duration": "25 - 30 Minutes",
                    "Passing Score": "70% or Higher",
                    "Attempts Allowed": "1 Single Attempt",
                    "Valid Until": expiry_str
                },
                guidelines=[
                    "Take the assessment in a quiet environment on desktop or laptop.",
                    "Do not refresh or close your browser tab once the assessment starts.",
                    "Instant Evaluation: Your results will be calculated immediately upon submission, and qualifying candidates automatically advance to the Technical Interview."
                ]
            )
            
        elif stage == "Technical Interview":
            template_name = "technical_interview_call"
            subject = f"Interview Scheduled: Technical Discussion for {job_title} - TalentIQ"
            
            # Look up interview record if scheduled
            interview = None
            if application.interviews:
                interview = sorted(application.interviews, key=lambda i: i.scheduled_at or datetime.min, reverse=True)[0]
                
            meet_url = meeting_link or (interview.meeting_link if interview else "https://meet.google.com/tiq-tech-eval")
            sched_time = scheduled_at or (interview.scheduled_at if interview else (datetime.now() + timedelta(days=2)))
            sched_str = sched_time.strftime("%A, %B %d, %Y at %I:%M %p") if isinstance(sched_time, datetime) else str(sched_time)
            int_name = interviewer_name or (interview.interviewer_name if interview else "Lead Systems Architect")
            score_text = f" with a score of <strong>{score:.1f}%</strong>" if score else ""
            
            intro_p = [
                f"Congratulations! You have successfully cleared the online assessment{score_text} and advanced to the <strong>Technical Interview Round</strong>.",
                f"Our engineering leadership is looking forward to discussing system design, technical problem solving, and hands-on projects with you."
            ]
            
            body_text = (
                f"Dear {name},\n\n"
                f"Congratulations! You have cleared the technical assessment and advanced to the Technical Interview for {job_title}.\n\n"
                f"Interview Details:\n"
                f"- Date & Time: {sched_str}\n"
                f"- Duration: 45 Minutes\n"
                f"- Interviewer: {int_name}\n"
                f"- Google Meet Link: {meet_url}\n\n"
                f"Preparation Guidelines:\n"
                f"- Join from a quiet location with working webcam and microphone.\n"
                f"- Be prepared to discuss past system architecture decisions and live coding scenarios.\n\n"
                f"Best of luck!\nTalentIQ Engineering Team"
            )
            
            body_html = cls._build_html_template(
                candidate_name=name,
                stage_badge="Technical Interview Scheduled",
                stage_color="#7c3aed",
                headline="You're Moving to the Technical Interview!",
                intro_paragraphs=intro_p,
                cta_label="📹 Join Google Meet Interview",
                cta_url=meet_url,
                key_details={
                    "Date & Time": sched_str,
                    "Duration": "45 Minutes",
                    "Interviewer": int_name,
                    "Format": "Google Meet Video Call",
                    "Google Meet Link": meet_url
                },
                guidelines=[
                    "Join the Google Meet link 5 minutes prior to the scheduled start time.",
                    "Ensure you have a functional camera, microphone, and stable high-speed internet.",
                    "Be ready to screen-share and discuss system design concepts and past project tradeoffs."
                ]
            )
            
        elif stage == "HR Interview":
            template_name = "hr_interview_call"
            subject = f"Next Step: Culture & Leadership Discussion - {job_title}"
            
            meet_url = meeting_link or "https://meet.google.com/tiq-culture-round"
            intro_p = [
                f"Outstanding work! You have cleared your technical round for <strong>{job_title}</strong>.",
                "We would love to invite you to the Culture, Leadership & Compensation discussion with our People Operations team."
            ]
            
            body_text = (
                f"Dear {name},\n\n"
                f"Great job on clearing your technical round! We'd like to schedule your culture & compensation discussion.\n"
                f"Meeting Link: {meet_url}\n\n"
                f"Warm regards,\nPeople & Culture Team"
            )
            
            body_html = cls._build_html_template(
                candidate_name=name,
                stage_badge="HR & Culture Round",
                stage_color="#059669",
                headline="Congratulations! Next Step: Culture & Leadership",
                intro_paragraphs=intro_p,
                cta_label="Join HR Discussion",
                cta_url=meet_url,
                key_details={
                    "Role": job_title,
                    "Discussion Focus": "Culture, Values, Team Dynamics & Compensation",
                    "Platform": "Google Meet"
                }
            )
            
        elif stage == "Offer":
            template_name = "job_offer"
            subject = f"Official Offer of Employment: Welcome to TalentIQ - {job_title}!"
            
            intro_p = [
                f"On behalf of the entire team at TalentIQ, we are thrilled to formally extend an <strong>Offer of Employment</strong> for the position of <strong>{job_title}</strong>!",
                "Throughout our evaluations, you demonstrated exceptional capability and engineering mindset. We believe you will make a huge impact on our team."
            ]
            
            body_text = (
                f"Dear {name},\n\n"
                f"We are thrilled to extend a formal offer of employment for {job_title} at TalentIQ!\n\n"
                f"Welcome aboard!\nTalentIQ Leadership & People Team"
            )
            
            body_html = cls._build_html_template(
                candidate_name=name,
                stage_badge="Official Offer Extended",
                stage_color="#059669",
                headline="Welcome to the TalentIQ Team!",
                intro_paragraphs=intro_p,
                key_details={
                    "Role": job_title,
                    "Offer Status": "Formal Letter Extended",
                    "Department": "Engineering & Technology"
                }
            )
            
        elif stage == "Rejected":
            template_name = "rejection_notice"
            subject = f"Application Update: {job_title} - TalentIQ"
            reason_text = f"Feedback: {custom_notes}" if custom_notes else ""
            
            intro_p = [
                f"Thank you for investing your time and effort in applying for the <strong>{job_title}</strong> role at TalentIQ.",
                "While we were impressed with your background and experience, we have decided to proceed with other candidates whose profiles more closely align with our immediate needs."
            ]
            if custom_notes:
                intro_p.append(f"<strong>Note from hiring team:</strong> {custom_notes}")
            intro_p.append("We have saved your credentials in our TalentIQ network and will prioritize contacting you for future roles.")
            
            body_text = (
                f"Dear {name},\n\n"
                f"Thank you for your interest in the {job_title} role at TalentIQ. "
                f"We have decided to move forward with other candidates at this time.\n\n"
                f"{reason_text}\n\n"
                f"Best regards,\nTalentIQ Hiring Team"
            )
            
            body_html = cls._build_html_template(
                candidate_name=name,
                stage_badge="Application Status",
                stage_color="#64748b",
                headline=f"Update Regarding Your Application for {job_title}",
                intro_paragraphs=intro_p
            )
        else:
            return None
            
        # Dispatch via SMTP if credentials exist (with both plain text and rich HTML)
        dispatched = cls._dispatch_smtp(email, name, subject, body_text, body_html)
        delivery_status = "sent" if (dispatched or not settings.SMTP_HOST) else "failed"

        log = EmailLog(
            application_id=application.id,
            recipient_email=email,
            recipient_name=name,
            subject=subject,
            template_name=template_name,
            body=body_html or body_text,
            status=delivery_status,
            sent_at=datetime.now(timezone.utc)
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
