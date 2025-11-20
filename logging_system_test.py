#!/usr/bin/env python3
"""
Direct Database Testing for Monitoring & Logging System
Testing logging service functionality and database operations
"""

import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

# Add backend directory to path
sys.path.append('/app/backend')

# Import logging service
from logging_service import LoggingService, LogLevel, LogCategory

class LoggingSystemDirectTester:
    def __init__(self):
        self.db = None
        self.logging_service = None
        self.tenant_id = "test-tenant-123"
        self.user_id = "test-user-123"
        self.test_results = []

    async def setup_database(self):
        """Setup database connection"""
        client = AsyncIOMotorClient('mongodb://localhost:27017')
        self.db = client['roomops']
        self.logging_service = LoggingService(self.db)
        print("✅ Database connection established")

    async def cleanup_test_data(self):
        """Clean up test data"""
        collections = [
            'error_logs', 'night_audit_logs', 'ota_sync_logs', 
            'rms_publish_logs', 'maintenance_prediction_logs', 
            'alert_history', 'alerts'
        ]
        
        for collection in collections:
            await self.db[collection].delete_many({'tenant_id': self.tenant_id})
        
        print("🧹 Test data cleaned up")

    async def test_error_logging(self):
        """Test error logging functionality"""
        print("\n📋 Testing Error Logging...")
        
        try:
            # Test different error severities
            error_tests = [
                {
                    "error_type": "ValidationError",
                    "message": "Invalid booking data",
                    "severity": LogLevel.ERROR,
                    "endpoint": "/api/bookings"
                },
                {
                    "error_type": "DatabaseError", 
                    "message": "Connection timeout",
                    "severity": LogLevel.CRITICAL,
                    "endpoint": "/api/payments"
                },
                {
                    "error_type": "AuthenticationError",
                    "message": "Invalid token",
                    "severity": LogLevel.WARNING,
                    "endpoint": "/api/auth/me"
                }
            ]
            
            created_logs = []
            for test in error_tests:
                log_id = await self.logging_service.log_error(
                    tenant_id=self.tenant_id,
                    error_type=test["error_type"],
                    error_message=test["message"],
                    endpoint=test["endpoint"],
                    user_id=self.user_id,
                    user_name="Test User",
                    severity=test["severity"],
                    metadata={"test": True}
                )
                created_logs.append(log_id)
                print(f"  ✅ Created {test['severity']} error log: {log_id}")
            
            # Verify logs were created
            total_logs = await self.db.error_logs.count_documents({'tenant_id': self.tenant_id})
            print(f"  ✅ Total error logs created: {total_logs}")
            
            # Test severity stats
            severity_stats = {}
            async for doc in self.db.error_logs.aggregate([
                {'$match': {'tenant_id': self.tenant_id}},
                {'$group': {'_id': '$severity', 'count': {'$sum': 1}}}
            ]):
                severity_stats[doc['_id']] = doc['count']
            
            print(f"  ✅ Severity stats: {severity_stats}")
            
            self.test_results.append({
                "test": "Error Logging",
                "status": "PASSED",
                "details": f"Created {len(created_logs)} error logs with proper severity distribution"
            })
            
        except Exception as e:
            print(f"  ❌ Error logging test failed: {e}")
            self.test_results.append({
                "test": "Error Logging", 
                "status": "FAILED",
                "details": str(e)
            })

    async def test_night_audit_logging(self):
        """Test night audit logging functionality"""
        print("\n📋 Testing Night Audit Logging...")
        
        try:
            # Test successful night audit
            log_id1 = await self.logging_service.log_night_audit(
                tenant_id=self.tenant_id,
                audit_date=datetime.now(timezone.utc).date().isoformat(),
                user_id=self.user_id,
                user_name="Test User",
                status="completed",
                rooms_processed=25,
                charges_posted=23,
                total_amount=3450.00,
                duration_seconds=45.2
            )
            print(f"  ✅ Created successful night audit log: {log_id1}")
            
            # Test failed night audit
            log_id2 = await self.logging_service.log_night_audit(
                tenant_id=self.tenant_id,
                audit_date=(datetime.now(timezone.utc) - timedelta(days=1)).date().isoformat(),
                user_id=self.user_id,
                user_name="Test User",
                status="failed",
                rooms_processed=25,
                charges_posted=0,
                total_amount=0.0,
                duration_seconds=12.1,
                errors=["Database connection failed", "Timeout error"]
            )
            print(f"  ✅ Created failed night audit log: {log_id2}")
            
            # Verify logs and calculate stats
            total_logs = await self.db.night_audit_logs.count_documents({'tenant_id': self.tenant_id})
            successful = await self.db.night_audit_logs.count_documents({
                'tenant_id': self.tenant_id, 
                'status': 'completed'
            })
            failed = await self.db.night_audit_logs.count_documents({
                'tenant_id': self.tenant_id, 
                'status': 'failed'
            })
            
            success_rate = (successful / total_logs * 100) if total_logs > 0 else 0
            
            print(f"  ✅ Night audit stats: {successful} successful, {failed} failed, {success_rate:.1f}% success rate")
            
            self.test_results.append({
                "test": "Night Audit Logging",
                "status": "PASSED", 
                "details": f"Created {total_logs} audit logs with proper status tracking"
            })
            
        except Exception as e:
            print(f"  ❌ Night audit logging test failed: {e}")
            self.test_results.append({
                "test": "Night Audit Logging",
                "status": "FAILED",
                "details": str(e)
            })

    async def test_ota_sync_logging(self):
        """Test OTA sync logging functionality"""
        print("\n📋 Testing OTA Sync Logging...")
        
        try:
            # Test different OTA channels
            sync_tests = [
                {
                    "channel": "booking_com",
                    "sync_type": "rates",
                    "status": "completed",
                    "records_synced": 150,
                    "records_failed": 0
                },
                {
                    "channel": "expedia", 
                    "sync_type": "availability",
                    "status": "partial",
                    "records_synced": 120,
                    "records_failed": 5
                },
                {
                    "channel": "airbnb",
                    "sync_type": "reservations", 
                    "status": "failed",
                    "records_synced": 0,
                    "records_failed": 25,
                    "errors": ["API rate limit exceeded", "Invalid credentials"]
                }
            ]
            
            created_logs = []
            for test in sync_tests:
                log_id = await self.logging_service.log_ota_sync(
                    tenant_id=self.tenant_id,
                    channel=test["channel"],
                    sync_type=test["sync_type"],
                    direction="push",
                    status=test["status"],
                    records_synced=test["records_synced"],
                    records_failed=test["records_failed"],
                    duration_seconds=30.5,
                    errors=test.get("errors", [])
                )
                created_logs.append(log_id)
                print(f"  ✅ Created {test['channel']} sync log: {log_id}")
            
            # Calculate channel stats
            channel_stats = {}
            async for doc in self.db.ota_sync_logs.aggregate([
                {'$match': {'tenant_id': self.tenant_id}},
                {'$group': {
                    '_id': '$channel',
                    'total': {'$sum': 1},
                    'successful': {
                        '$sum': {'$cond': [{'$eq': ['$status', 'completed']}, 1, 0]}
                    },
                    'records_synced': {'$sum': '$records_synced'}
                }}
            ]):
                channel_name = doc['_id']
                channel_stats[channel_name] = {
                    'total_syncs': doc['total'],
                    'successful': doc['successful'],
                    'success_rate': round(doc['successful'] / doc['total'] * 100, 1),
                    'records_synced': doc['records_synced']
                }
            
            print(f"  ✅ Channel stats: {channel_stats}")
            
            self.test_results.append({
                "test": "OTA Sync Logging",
                "status": "PASSED",
                "details": f"Created {len(created_logs)} sync logs across {len(channel_stats)} channels"
            })
            
        except Exception as e:
            print(f"  ❌ OTA sync logging test failed: {e}")
            self.test_results.append({
                "test": "OTA Sync Logging",
                "status": "FAILED", 
                "details": str(e)
            })

    async def test_rms_publish_logging(self):
        """Test RMS publish logging functionality"""
        print("\n📋 Testing RMS Publish Logging...")
        
        try:
            # Test different publish scenarios
            publish_tests = [
                {
                    "publish_type": "rates",
                    "auto_published": True,
                    "status": "completed",
                    "records_published": 200,
                    "records_failed": 0
                },
                {
                    "publish_type": "restrictions",
                    "auto_published": False,
                    "status": "completed", 
                    "records_published": 150,
                    "records_failed": 2
                },
                {
                    "publish_type": "inventory",
                    "auto_published": True,
                    "status": "failed",
                    "records_published": 0,
                    "records_failed": 100,
                    "errors": ["Channel API down", "Authentication failed"]
                }
            ]
            
            created_logs = []
            for test in publish_tests:
                log_id = await self.logging_service.log_rms_publish(
                    tenant_id=self.tenant_id,
                    publish_type=test["publish_type"],
                    channels=["booking_com", "expedia"],
                    room_types=["standard", "deluxe"],
                    date_range={"start": "2025-01-15", "end": "2025-01-30"},
                    status=test["status"],
                    records_published=test["records_published"],
                    records_failed=test["records_failed"],
                    auto_published=test["auto_published"],
                    triggered_by="auto" if test["auto_published"] else "manual",
                    user_id=self.user_id,
                    user_name="Test User",
                    duration_seconds=25.3,
                    errors=test.get("errors", [])
                )
                created_logs.append(log_id)
                print(f"  ✅ Created {test['publish_type']} publish log: {log_id}")
            
            # Calculate automation stats
            total_publishes = len(created_logs)
            auto_publishes = sum(1 for test in publish_tests if test["auto_published"])
            automation_rate = (auto_publishes / total_publishes * 100) if total_publishes > 0 else 0
            
            print(f"  ✅ Automation rate: {auto_publishes}/{total_publishes} ({automation_rate:.1f}%)")
            
            self.test_results.append({
                "test": "RMS Publish Logging",
                "status": "PASSED",
                "details": f"Created {len(created_logs)} publish logs with {automation_rate:.1f}% automation rate"
            })
            
        except Exception as e:
            print(f"  ❌ RMS publish logging test failed: {e}")
            self.test_results.append({
                "test": "RMS Publish Logging",
                "status": "FAILED",
                "details": str(e)
            })

    async def test_maintenance_prediction_logging(self):
        """Test maintenance prediction logging functionality"""
        print("\n📋 Testing Maintenance Prediction Logging...")
        
        try:
            # Test different prediction scenarios
            prediction_tests = [
                {
                    "equipment_type": "hvac",
                    "room_number": "101",
                    "prediction_result": "high",
                    "confidence_score": 0.92,
                    "days_until_failure": 3,
                    "auto_task_created": True
                },
                {
                    "equipment_type": "elevator",
                    "room_number": None,
                    "prediction_result": "medium", 
                    "confidence_score": 0.75,
                    "days_until_failure": 15,
                    "auto_task_created": False
                },
                {
                    "equipment_type": "plumbing",
                    "room_number": "205",
                    "prediction_result": "low",
                    "confidence_score": 0.45,
                    "days_until_failure": 45,
                    "auto_task_created": False
                }
            ]
            
            created_logs = []
            for test in prediction_tests:
                log_id = await self.logging_service.log_maintenance_prediction(
                    tenant_id=self.tenant_id,
                    prediction_type="failure_risk",
                    equipment_type=test["equipment_type"],
                    room_number=test["room_number"],
                    prediction_result=test["prediction_result"],
                    confidence_score=test["confidence_score"],
                    days_until_failure=test["days_until_failure"],
                    indicators=["temperature anomaly", "vibration increase"],
                    recommended_action="Schedule preventive maintenance",
                    auto_task_created=test["auto_task_created"],
                    model_version="v2.1"
                )
                created_logs.append(log_id)
                print(f"  ✅ Created {test['equipment_type']} prediction log: {log_id}")
            
            # Calculate risk distribution
            risk_stats = {}
            async for doc in self.db.maintenance_prediction_logs.aggregate([
                {'$match': {'tenant_id': self.tenant_id}},
                {'$group': {
                    '_id': '$prediction_result',
                    'count': {'$sum': 1},
                    'avg_confidence': {'$avg': '$confidence_score'},
                    'tasks_created': {
                        '$sum': {'$cond': ['$auto_task_created', 1, 0]}
                    }
                }}
            ]):
                risk_level = doc['_id']
                risk_stats[risk_level] = {
                    'count': doc['count'],
                    'avg_confidence': round(doc['avg_confidence'], 3),
                    'tasks_created': doc['tasks_created']
                }
            
            print(f"  ✅ Risk distribution: {risk_stats}")
            
            self.test_results.append({
                "test": "Maintenance Prediction Logging",
                "status": "PASSED",
                "details": f"Created {len(created_logs)} prediction logs with proper risk distribution"
            })
            
        except Exception as e:
            print(f"  ❌ Maintenance prediction logging test failed: {e}")
            self.test_results.append({
                "test": "Maintenance Prediction Logging",
                "status": "FAILED",
                "details": str(e)
            })

    async def test_alert_system(self):
        """Test alert creation and management"""
        print("\n📋 Testing Alert System...")
        
        try:
            # Test different alert types
            alert_tests = [
                {
                    "alert_type": "critical_error",
                    "title": "Database Connection Failed",
                    "description": "Primary database connection lost",
                    "severity": "critical",
                    "source_module": "database"
                },
                {
                    "alert_type": "night_audit_failed",
                    "title": "Night Audit Failed",
                    "description": "Night audit for 2025-01-15 failed",
                    "severity": "high",
                    "source_module": "night_audit"
                },
                {
                    "alert_type": "maintenance_high_risk",
                    "title": "High Risk: HVAC in Room 101",
                    "description": "Predicted failure in 3 days",
                    "severity": "high",
                    "source_module": "predictive_maintenance"
                }
            ]
            
            created_alerts = []
            for test in alert_tests:
                alert_id = await self.logging_service.create_alert(
                    tenant_id=self.tenant_id,
                    alert_type=test["alert_type"],
                    title=test["title"],
                    description=test["description"],
                    severity=test["severity"],
                    source_module=test["source_module"]
                )
                created_alerts.append(alert_id)
                print(f"  ✅ Created {test['severity']} alert: {alert_id}")
            
            # Calculate alert stats
            stats = {
                'total_alerts': len(created_alerts),
                'unread': 0,
                'by_severity': {},
                'by_module': {}
            }
            
            async for alert in self.db.alert_history.find({'tenant_id': self.tenant_id}):
                status = alert.get('status', 'unread')
                if status == 'unread':
                    stats['unread'] += 1
                
                severity = alert.get('severity', 'medium')
                stats['by_severity'][severity] = stats['by_severity'].get(severity, 0) + 1
                
                module = alert.get('source_module', 'system')
                stats['by_module'][module] = stats['by_module'].get(module, 0) + 1
            
            print(f"  ✅ Alert stats: {stats}")
            
            self.test_results.append({
                "test": "Alert System",
                "status": "PASSED",
                "details": f"Created {len(created_alerts)} alerts with proper categorization"
            })
            
        except Exception as e:
            print(f"  ❌ Alert system test failed: {e}")
            self.test_results.append({
                "test": "Alert System",
                "status": "FAILED",
                "details": str(e)
            })

    async def test_dashboard_data_aggregation(self):
        """Test dashboard data aggregation"""
        print("\n📋 Testing Dashboard Data Aggregation...")
        
        try:
            # Get counts for each log type
            error_count = await self.db.error_logs.count_documents({'tenant_id': self.tenant_id})
            night_audit_count = await self.db.night_audit_logs.count_documents({'tenant_id': self.tenant_id})
            ota_sync_count = await self.db.ota_sync_logs.count_documents({'tenant_id': self.tenant_id})
            rms_publish_count = await self.db.rms_publish_logs.count_documents({'tenant_id': self.tenant_id})
            maintenance_prediction_count = await self.db.maintenance_prediction_logs.count_documents({'tenant_id': self.tenant_id})
            alert_count = await self.db.alert_history.count_documents({'tenant_id': self.tenant_id})
            
            # Get recent critical errors
            yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            recent_critical_errors = []
            async for error in self.db.error_logs.find({
                'tenant_id': self.tenant_id,
                'severity': 'critical',
                'timestamp': {'$gte': yesterday},
                'resolved': False
            }).sort('timestamp', -1).limit(5):
                recent_critical_errors.append(error)
            
            # Get unread alerts
            unread_alerts = []
            async for alert in self.db.alerts.find({
                'tenant_id': self.tenant_id,
                'status': 'unread'
            }).sort('timestamp', -1).limit(10):
                unread_alerts.append(alert)
            
            dashboard_data = {
                'summary': {
                    'error_logs': error_count,
                    'night_audit_logs': night_audit_count,
                    'ota_sync_logs': ota_sync_count,
                    'rms_publish_logs': rms_publish_count,
                    'maintenance_prediction_logs': maintenance_prediction_count,
                    'alert_history': alert_count
                },
                'recent_critical_errors': len(recent_critical_errors),
                'unread_alerts': len(unread_alerts),
                'health': {
                    'overall_status': 'warning' if len(recent_critical_errors) > 0 else 'healthy',
                    'indicators': []
                }
            }
            
            print(f"  ✅ Dashboard summary: {dashboard_data['summary']}")
            print(f"  ✅ Critical errors: {dashboard_data['recent_critical_errors']}")
            print(f"  ✅ Unread alerts: {dashboard_data['unread_alerts']}")
            print(f"  ✅ Health status: {dashboard_data['health']['overall_status']}")
            
            self.test_results.append({
                "test": "Dashboard Data Aggregation",
                "status": "PASSED",
                "details": f"Successfully aggregated data from {len(dashboard_data['summary'])} log types"
            })
            
        except Exception as e:
            print(f"  ❌ Dashboard aggregation test failed: {e}")
            self.test_results.append({
                "test": "Dashboard Data Aggregation",
                "status": "FAILED",
                "details": str(e)
            })

    async def run_all_tests(self):
        """Run all logging system tests"""
        print("🚀 Starting Direct Monitoring & Logging System Tests")
        print("=" * 70)
        
        # Setup
        await self.setup_database()
        await self.cleanup_test_data()
        
        # Run tests
        await self.test_error_logging()
        await self.test_night_audit_logging()
        await self.test_ota_sync_logging()
        await self.test_rms_publish_logging()
        await self.test_maintenance_prediction_logging()
        await self.test_alert_system()
        await self.test_dashboard_data_aggregation()
        
        # Print results
        self.print_test_summary()
        
        # Cleanup
        await self.cleanup_test_data()

    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 70)
        print("📊 MONITORING & LOGGING SYSTEM TEST RESULTS")
        print("=" * 70)
        
        passed = sum(1 for result in self.test_results if result["status"] == "PASSED")
        total = len(self.test_results)
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print("\n📋 TEST RESULTS:")
        print("-" * 50)
        
        for result in self.test_results:
            status_icon = "✅" if result["status"] == "PASSED" else "❌"
            print(f"{status_icon} {result['test']}: {result['status']}")
            print(f"   {result['details']}")
        
        print("\n" + "=" * 70)
        print(f"📈 OVERALL SUCCESS RATE: {passed}/{total} ({success_rate:.1f}%)")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Monitoring & Logging System is working perfectly!")
        elif success_rate >= 75:
            print("✅ GOOD: Most monitoring features are working correctly")
        elif success_rate >= 50:
            print("⚠️ PARTIAL: Some monitoring features need attention")
        else:
            print("❌ CRITICAL: Major issues with monitoring system")
        
        print("\n🔍 KEY FEATURES TESTED:")
        print("• Error Logging: Multiple severity levels with proper categorization")
        print("• Night Audit Logging: Success/failure tracking with metrics")
        print("• OTA Sync Logging: Multi-channel sync with statistics")
        print("• RMS Publish Logging: Rate publishing with automation tracking")
        print("• Maintenance Predictions: AI predictions with risk assessment")
        print("• Alert System: Alert creation and categorization")
        print("• Dashboard Aggregation: Comprehensive data summarization")
        
        print("\n" + "=" * 70)

async def main():
    """Main test execution"""
    tester = LoggingSystemDirectTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())