const { v4: uuidv4 } = require('uuid');

class Invite {
  constructor(db) {
    this.db = db;
  }

  async create(inviteData) {
    const inviteCode = this.generateInviteCode();
    const invite = {
      id: uuidv4(),
      invite_code: inviteCode,
      email: inviteData.email || null,
      role: inviteData.role || 'vendor',
      status: 'active',
      max_uses: inviteData.max_uses || 1,
      times_used: 0,
      expires_at: inviteData.expires_at || null,
      notes: inviteData.notes || null,
      created_by: inviteData.created_by,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [result] = await this.db('invites').insert(invite).returning('*');
    return result;
  }

  async findByCode(inviteCode) {
    return await this.db('invites')
      .where('invite_code', inviteCode)
      .first();
  }

  async findByEmail(email) {
    return await this.db('invites')
      .where('email', email)
      .where('status', 'active')
      .first();
  }

  async markAsUsed(inviteId, userId) {
    const [result] = await this.db('invites')
      .where('id', inviteId)
      .update({
        status: 'used',
        times_used: this.db.raw('times_used + 1'),
        used_at: new Date(),
        used_by: userId,
        updated_at: new Date()
      })
      .returning('*');
    
    return result;
  }

  async getInvitesByCreator(createdBy) {
    return await this.db('invites')
      .where('created_by', createdBy)
      .orderBy('created_at', 'desc');
  }

  async deleteInvite(inviteId) {
    return await this.db('invites')
      .where('id', inviteId)
      .del();
  }

  async isValid(inviteCode) {
    const invite = await this.findByCode(inviteCode);
    
    if (!invite) {
      return { valid: false, reason: 'Invite not found' };
    }

    if (invite.status !== 'active') {
      return { valid: false, reason: 'Invite is not active' };
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return { valid: false, reason: 'Invite has expired' };
    }

    if (invite.times_used >= invite.max_uses) {
      return { valid: false, reason: 'Invite has been used too many times' };
    }

    return { valid: true, invite };
  }

  generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

module.exports = Invite;
