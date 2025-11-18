import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ProjectNotificationEmailProps {
  projectName: string;
  projectId: string;
  action: string;
  details: string;
  actionUrl: string;
  recipientName: string;
}

export const ProjectNotificationEmail = ({
  projectName,
  projectId,
  action,
  details,
  actionUrl,
  recipientName,
}: ProjectNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {action} - {projectName}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="/logo.png"
          width="170"
          height="50"
          alt="CSIR Stage-Gate"
          style={logo}
        />
        <Text style={paragraph}>Hi {recipientName},</Text>
        <Text style={paragraph}>
          There has been an update to project <strong>{projectName}</strong> (
          {projectId}):
        </Text>
        <Section style={notificationBox}>
          <Text style={notificationTitle}>{action}</Text>
          <Text style={notificationDetails}>{details}</Text>
        </Section>
        <Section style={btnContainer}>
          <Button style={button} href={actionUrl}>
            View Project
          </Button>
        </Section>
        <Text style={paragraph}>
          You're receiving this email because you're involved in this project or
          have requested notifications.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          CSIR Stage-Gate Platform - Research & Development Management System
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const logo = {
  margin: "0 auto",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
};

const notificationBox = {
  backgroundColor: "#f6f9fc",
  borderRadius: "4px",
  padding: "20px",
  margin: "20px 0",
};

const notificationTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 10px 0",
  color: "#005b9f",
};

const notificationDetails = {
  fontSize: "14px",
  margin: "0",
  color: "#666666",
};

const btnContainer = {
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#005b9f",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
};
