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

interface VerificationEmailProps {
  confirmLink: string;
}

export const VerificationEmail = ({ confirmLink }: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirm your email address for CSIR Stage-Gate Platform</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="/logo.png"
          width="170"
          height="50"
          alt="CSIR Stage-Gate"
          style={logo}
        />
        <Text style={paragraph}>Hi there,</Text>
        <Text style={paragraph}>
          Welcome to the CSIR Stage-Gate Platform! Please confirm your email
          address by clicking the button below.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={confirmLink}>
            Confirm Email Address
          </Button>
        </Section>
        <Text style={paragraph}>
          If you didn't create an account with us, you can safely ignore this
          email.
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
