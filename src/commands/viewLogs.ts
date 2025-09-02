import { AuditLog } from '../models';

export async function viewLogs(limit: number = 50, user?: string, action?: string): Promise<void> {
  console.log('📋 Viewing Audit Logs');
  
  if (user || action) {
    console.log(`🔍 Filters: ${user ? `User: ${user}` : ''}${user && action ? ' | ' : ''}${action ? `Action: ${action}` : ''}`);
  }
  
  console.log(`📊 Limit: ${limit} logs\n`);

  try {
    // Build query
    const query: any = {};
    if (user) {
      query.user = { $regex: user, $options: 'i' };
    }
    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    // Get logs
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);

    if (logs.length === 0) {
      console.log('📭 No audit logs found matching the criteria.');
      return;
    }

    // Display logs
    console.log('='.repeat(100));
    console.log('📋 AUDIT LOGS');
    console.log('='.repeat(100));

    logs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.action.toUpperCase()}`);
      console.log('─'.repeat(80));
      console.log(`   👤 User: ${log.user}`);
      console.log(`   🕒 Timestamp: ${log.timestamp.toLocaleString()}`);
      
      if (log.resourceType) {
        console.log(`   📄 Resource Type: ${log.resourceType}`);
      }
      
      if (log.resourceId) {
        console.log(`   🆔 Resource ID: ${log.resourceId}`);
      }
      
      if (log.ipAddress) {
        console.log(`   🌐 IP Address: ${log.ipAddress}`);
      }
      
      if (log.details) {
        console.log(`   📝 Details:`);
        if (typeof log.details === 'object') {
          Object.entries(log.details).forEach(([key, value]) => {
            if (key === 'timestamp') {
              console.log(`      ${key}: ${new Date(value as string).toLocaleString()}`);
            } else {
              console.log(`      ${key}: ${value}`);
            }
          });
        } else {
          console.log(`      ${log.details}`);
        }
      }
    });

    // Show summary statistics
    console.log('\n' + '='.repeat(100));
    console.log('📊 AUDIT LOG STATISTICS');
    console.log('='.repeat(100));

    // Total logs
    const totalLogs = await AuditLog.countDocuments();
    console.log(`📈 Total Logs in Database: ${totalLogs}`);

    // Logs by action
    const actionStats = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n🔍 Logs by Action:');
    actionStats.forEach(stat => {
      const percentage = ((stat.count / totalLogs) * 100).toFixed(1);
      console.log(`   ${stat._id}: ${stat.count} (${percentage}%)`);
    });

    // Logs by user
    const userStats = await AuditLog.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    console.log('\n👥 Top 10 Users by Activity:');
    userStats.forEach((stat, index) => {
      const percentage = ((stat.count / totalLogs) * 100).toFixed(1);
      console.log(`   ${index + 1}. ${stat._id}: ${stat.count} (${percentage}%)`);
    });

    // Recent activity
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = await AuditLog.countDocuments({ timestamp: { $gte: last24Hours } });
    
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyLogs = await AuditLog.countDocuments({ timestamp: { $gte: last7Days } });

    console.log('\n⏰ Recent Activity:');
    console.log(`   Last 24 hours: ${recentLogs} logs`);
    console.log(`   Last 7 days: ${weeklyLogs} logs`);

    // Resource type distribution
    const resourceStats = await AuditLog.aggregate([
      { $match: { resourceType: { $exists: true } } },
      { $group: { _id: '$resourceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    if (resourceStats.length > 0) {
      console.log('\n📄 Logs by Resource Type:');
      resourceStats.forEach(stat => {
        const percentage = ((stat.count / totalLogs) * 100).toFixed(1);
        console.log(`   ${stat._id}: ${stat.count} (${percentage}%)`);
      });
    }

    console.log('\n' + '='.repeat(100));
    console.log('💡 Tips:');
    console.log('   • Use --user <username> to filter by specific user');
    console.log('   • Use --action <action> to filter by specific action');
    console.log('   • Use --limit <number> to show more/fewer logs');
    console.log('   • Logs are automatically cleaned up after 1 year');

  } catch (error) {
    console.error('❌ Error viewing audit logs:', error);
    throw error;
  }
}
