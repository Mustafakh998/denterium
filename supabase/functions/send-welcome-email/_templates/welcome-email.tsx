import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  firstName: string
  email: string
  confirmationUrl: string
  userType: 'dentist' | 'supplier' | 'admin' | 'assistant' | 'receptionist'
}

export const WelcomeEmail = ({
  firstName,
  email,
  confirmationUrl,
  userType,
}: WelcomeEmailProps) => {
  const getUserTypeArabic = (type: string) => {
    switch (type) {
      case 'dentist': return 'طبيب أسنان'
      case 'supplier': return 'مورد'
      case 'admin': return 'مدير'
      case 'assistant': return 'مساعد'
      case 'receptionist': return 'موظف استقبال'
      default: return 'مستخدم'
    }
  }

  const getUserTypeEnglish = (type: string) => {
    switch (type) {
      case 'dentist': return 'Dentist'
      case 'supplier': return 'Supplier'
      case 'admin': return 'Administrator'
      case 'assistant': return 'Assistant'
      case 'receptionist': return 'Receptionist'
      default: return 'User'
    }
  }

  return (
    <Html>
      <Head />
      <Preview>مرحباً بك في دنتال برو - Welcome to Dental Pro</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Arabic Section */}
          <Section style={arabicSection}>
            <Heading style={h1Arabic}>مرحباً بك في دنتال برو! 🦷</Heading>
            <Text style={textArabic}>
              عزيزي/عزيزتي {firstName}،
            </Text>
            <Text style={textArabic}>
              مرحباً بك في منصة دنتال برو، النظام الشامل لإدارة العيادات السنية ومستلزماتها الطبية.
            </Text>
            <Text style={textArabic}>
              تم تسجيلك بنجاح كـ <strong>{getUserTypeArabic(userType)}</strong> في نظامنا.
            </Text>
            <Text style={textArabic}>
              لتفعيل حسابك والبدء في استخدام النظام، يرجى النقر على الرابط أدناه:
            </Text>
            <Link
              href={confirmationUrl}
              target="_blank"
              style={{
                ...linkArabic,
                display: 'block',
                marginBottom: '16px',
                textAlign: 'center' as const,
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '6px',
                textDecoration: 'none',
              }}
            >
              تفعيل الحساب الآن
            </Link>
            <Text style={textArabic}>
              <strong>ما يمكنك فعله في دنتال برو:</strong>
            </Text>
            {userType === 'supplier' ? (
              <Text style={textArabic}>
                • إدارة المنتجات والمخزون<br/>
                • استقبال ومعالجة الطلبات<br/>
                • متابعة المدفوعات والفواتير<br/>
                • التواصل مع العيادات السنية<br/>
                • تحليل المبيعات والتقارير
              </Text>
            ) : (
              <Text style={textArabic}>
                • إدارة المرضى والمواعيد<br/>
                • تسجيل العلاجات والفحوصات<br/>
                • إدارة الفواتير والمدفوعات<br/>
                • طلب المستلزمات الطبية<br/>
                • تصدير التقارير والإحصائيات
              </Text>
            )}
          </Section>

          <Hr style={divider} />

          {/* English Section */}
          <Section style={englishSection}>
            <Heading style={h1English}>Welcome to Dental Pro! 🦷</Heading>
            <Text style={textEnglish}>
              Dear {firstName},
            </Text>
            <Text style={textEnglish}>
              Welcome to Dental Pro, the comprehensive platform for dental clinic management and medical supplies.
            </Text>
            <Text style={textEnglish}>
              You have been successfully registered as a <strong>{getUserTypeEnglish(userType)}</strong> in our system.
            </Text>
            <Text style={textEnglish}>
              To activate your account and start using the system, please click the link below:
            </Text>
            <Link
              href={confirmationUrl}
              target="_blank"
              style={{
                ...linkEnglish,
                display: 'block',
                marginBottom: '16px',
                textAlign: 'center' as const,
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '6px',
                textDecoration: 'none',
              }}
            >
              Activate Account Now
            </Link>
            <Text style={textEnglish}>
              <strong>What you can do with Dental Pro:</strong>
            </Text>
            {userType === 'supplier' ? (
              <Text style={textEnglish}>
                • Manage products and inventory<br/>
                • Receive and process orders<br/>
                • Track payments and invoices<br/>
                • Communicate with dental clinics<br/>
                • Analyze sales and reports
              </Text>
            ) : (
              <Text style={textEnglish}>
                • Manage patients and appointments<br/>
                • Record treatments and examinations<br/>
                • Handle billing and payments<br/>
                • Order medical supplies<br/>
                • Export reports and statistics
              </Text>
            )}
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا.<br/>
            If you have any questions, don't hesitate to contact us.<br/>
            <Link href="mailto:support@dentalpro.com" style={linkFooter}>
              support@dentalpro.com
            </Link>
          </Text>
          
          <Text style={footerSmall}>
            دنتال برو - نظام إدارة العيادات السنية<br/>
            Dental Pro - Dental Clinic Management System
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const arabicSection = {
  padding: '0 48px',
  direction: 'rtl' as const,
  textAlign: 'right' as const,
}

const englishSection = {
  padding: '0 48px',
  direction: 'ltr' as const,
  textAlign: 'left' as const,
}

const h1Arabic = {
  color: '#333',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const h1English = {
  color: '#333',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const textArabic = {
  color: '#333',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'right' as const,
  direction: 'rtl' as const,
}

const textEnglish = {
  color: '#333',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'left' as const,
  direction: 'ltr' as const,
}

const linkArabic = {
  color: '#2563eb',
  textDecoration: 'underline',
  direction: 'rtl' as const,
}

const linkEnglish = {
  color: '#2563eb',
  textDecoration: 'underline',
  direction: 'ltr' as const,
}

const divider = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  margin: '48px 0 12px',
}

const linkFooter = {
  color: '#2563eb',
  textDecoration: 'underline',
}

const footerSmall = {
  color: '#8898aa',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '0',
}