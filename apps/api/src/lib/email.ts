import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = "TherapySync <noreply@therapysync.app>";

type EmailPayload = {
	to: string;
	subject: string;
	html: string;
};

export async function sendEmail({ to, subject, html }: EmailPayload) {
	if (!process.env.RESEND_API_KEY) {
		console.warn("RESEND_API_KEY not set, skipping email:", subject);
		return;
	}

	try {
		const { error } = await resend.emails.send({
			from: FROM_EMAIL,
			to,
			subject,
			html,
		});

		if (error) {
			console.error("Failed to send email:", error);
		}
	} catch (error) {
		console.error("Email send error:", error);
	}
}

// Session email templates
export function sessionCreatedEmail(params: {
	clientName: string;
	therapistName: string;
	title: string;
	startTime: Date;
	location: string | null;
}) {
	const date = params.startTime.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const time = params.startTime.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
	});

	return {
		subject: `New Session Scheduled: ${params.title}`,
		html: `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #6C63FF;">New Session Scheduled</h2>
				<p>Hi ${params.clientName},</p>
				<p>${params.therapistName} has scheduled a new session with you.</p>
				<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
					<p><strong>${params.title}</strong></p>
					<p>${date} at ${time}</p>
					${params.location ? `<p>Location: ${params.location}</p>` : ""}
				</div>
				<p>Please confirm or reschedule in the TherapySync app.</p>
			</div>
		`,
	};
}

export function sessionCancelledEmail(params: {
	recipientName: string;
	cancelledByName: string;
	title: string;
	startTime: Date;
	reason: string | null;
}) {
	const date = params.startTime.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return {
		subject: `Session Cancelled: ${params.title}`,
		html: `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #e53e3e;">Session Cancelled</h2>
				<p>Hi ${params.recipientName},</p>
				<p>${params.cancelledByName} has cancelled the following session:</p>
				<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
					<p><strong>${params.title}</strong></p>
					<p>${date}</p>
					${params.reason ? `<p>Reason: ${params.reason}</p>` : ""}
				</div>
			</div>
		`,
	};
}

export function sessionReminderEmail(params: {
	recipientName: string;
	title: string;
	startTime: Date;
	location: string | null;
}) {
	const date = params.startTime.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const time = params.startTime.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
	});

	return {
		subject: `Reminder: ${params.title} tomorrow`,
		html: `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #6C63FF;">Session Reminder</h2>
				<p>Hi ${params.recipientName},</p>
				<p>This is a reminder about your upcoming session tomorrow.</p>
				<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
					<p><strong>${params.title}</strong></p>
					<p>${date} at ${time}</p>
					${params.location ? `<p>Location: ${params.location}</p>` : ""}
				</div>
			</div>
		`,
	};
}
