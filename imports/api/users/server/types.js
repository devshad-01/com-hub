// imports/api/users/server/types.js
// This file exists to document the expected structure of extended user fields
// Since we're using JavaScript, these are just comments for documentation

/*
Extended User fields we add:
- isEmailVerified: boolean
- lastLoginAt: Date | null
- loginAttempts: number
- accountLocked: boolean
- lockUntil: Date | null
- lastVerificationEmailSent: Date

Extended UserProfile fields:
- name: string
- bio: string
- location: string
- avatar: string
- lastUpdated: Date

Extended UserServices fields:
- resume.loginTokens: Array<{when: Date, hashedToken: string}>
*/
