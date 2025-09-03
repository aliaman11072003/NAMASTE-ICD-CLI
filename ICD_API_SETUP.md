# 🔑 ICD API Credentials Setup Guide

This guide explains how to configure your ICD API credentials for the NAMASTE-ICD CLI application.

## 📋 What You Received

**Client ID**: `4e6bb28f-227f-4fb1-a4f1-13740a2d4f54_c9c79725-47f9-4cd8-a039-b3142bb0261e`
**Client Secret**: `1e0iNv0msJLjA26vUzcMSVzLJOBqnid4fe3Sf4ZlXnE=`

## 🚀 Quick Setup (Recommended)

Run the automated setup script:

```bash
./setup-env.sh
```

This will:
- Create a `.env` file with your credentials
- Configure all necessary environment variables
- Set up MongoDB and other settings

## 🔧 Manual Setup

If you prefer to set up manually:

1. **Copy the example environment file**:
   ```bash
   cp env.example .env
   ```

2. **Edit the `.env` file** and add your credentials:
   ```bash
   # ICD API Authentication
   ICD_CLIENT_ID=4e6bb28f-227f-4fb1-a4f1-13740a2d4f54_c9c79725-47f9-4cd8-a039-b3142bb0261e
   ICD_CLIENT_SECRET=1e0iNv0msJLjA26vUzcMSVzLJOBqnid4fe3Sf4ZlXnE=
   ```

## ✅ Verify Setup

Test your authentication:

```bash
# Option 1: Use npm script
npm run test-auth

# Option 2: Run directly
node test-auth.js

# Option 3: Test with CLI
npm run dev fetch-icd "test" --type both
```

## 🔒 Security Notes

- **Never commit your `.env` file** to version control
- The `.env` file is already in `.gitignore`
- Keep your credentials secure and private
- Rotate credentials if they are ever compromised

## 🐛 Troubleshooting

### Common Issues

1. **"Missing ICD API credentials"**
   - Run `./setup-env.sh` or manually create `.env` file

2. **"401 Unauthorized"**
   - Verify your credentials are correct
   - Check for typos in Client ID or Secret

3. **"403 Forbidden"**
   - Your API key may not have the required permissions
   - Contact WHO support if this persists

4. **Network errors**
   - Check your internet connection
   - Verify firewall settings

### Debug Mode

Enable verbose logging:
```bash
LOG_LEVEL=debug
```

## 📚 What's Been Updated

The following files have been modified to support ICD API authentication:

- `src/utils/whoApi.ts` - Added authentication headers to all API calls
- `env.example` - Added ICD API credential placeholders
- `README.md` - Added setup instructions and troubleshooting
- `setup-env.sh` - Automated setup script
- `test-auth.js` - Authentication test script
- `package.json` - Added test-auth script

## 🌐 API Endpoints

Your credentials will be used to access:
- **Search API**: `/search` - Find ICD-11 codes
- **Content API**: `/content/{id}` - Get code details
- **Status API**: `/` - Check API health

## 📞 Support

If you continue to have issues:
1. Check the troubleshooting section in README.md
2. Verify your credentials with WHO support
3. Check the audit logs: `npm run dev view-logs`

---

**🎉 You're all set! Your NAMASTE-ICD CLI now has full access to the WHO ICD-11 API.**
