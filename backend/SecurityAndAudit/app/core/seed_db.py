"""
Database seeding script
Populates the database with initial data for testing and development
"""

from datetime import datetime, date
from decimal import Decimal
from passlib.context import CryptContext
from app.core.database import SessionLocal
from app.modules.access.models import User, Profile, Permission, ProfilePermission
from app.modules.audit.models import Customer, Order

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_permissions():
    """Create initial permissions"""
    db = SessionLocal()
    try:
        permissions_data = [
            {
                "permission_name": "view_reports",
                "description": "View audit and business reports",
            },
            {
                "permission_name": "create_document",
                "description": "Create new documents",
            },
            {
                "permission_name": "edit_document",
                "description": "Edit existing documents",
            },
            {"permission_name": "delete_document", "description": "Delete documents"},
            {"permission_name": "edit_profile", "description": "Edit user profiles"},
            {
                "permission_name": "delete_user",
                "description": "Delete users from the system",
            },
            {
                "permission_name": "manage_permissions",
                "description": "Manage system permissions",
            },
            {"permission_name": "view_users", "description": "View user information"},
        ]

        created_permissions = []
        for perm_data in permissions_data:
            # Check if permission already exists
            existing = (
                db.query(Permission)
                .filter(Permission.permission_name == perm_data["permission_name"])
                .first()
            )

            if not existing:
                permission = Permission(**perm_data)
                db.add(permission)
                created_permissions.append(perm_data["permission_name"])

        db.commit()
        if created_permissions:
            print(
                f"Created {len(created_permissions)} permissions: {', '.join(created_permissions)}"
            )
        else:
            print("Permissions already exist")
    except Exception as e:
        db.rollback()
        print(f"Error seeding permissions: {e}")
    finally:
        db.close()


def seed_profiles():
    """Create initial profiles (roles)"""
    db = SessionLocal()
    try:
        profiles_data = [
            {
                "profile_name": "Administrator",
                "description": "Full system access with all permissions",
            },
            {
                "profile_name": "Editor",
                "description": "Can create and edit documents, view reports",
            },
            {
                "profile_name": "Viewer",
                "description": "Read-only access to reports and documents",
            },
            {
                "profile_name": "Manager",
                "description": "Can view reports and manage users",
            },
        ]

        created_profiles = []
        for profile_data in profiles_data:
            existing = (
                db.query(Profile)
                .filter(Profile.profile_name == profile_data["profile_name"])
                .first()
            )

            if not existing:
                profile = Profile(**profile_data)
                db.add(profile)
                created_profiles.append(profile_data["profile_name"])

        db.commit()
        if created_profiles:
            print(
                f"Created {len(created_profiles)} profiles: {', '.join(created_profiles)}"
            )
        else:
            print("Profiles already exist")
    except Exception as e:
        db.rollback()
        print(f"Error seeding profiles: {e}")
    finally:
        db.close()


def seed_profile_permissions():
    """Assign permissions to profiles"""
    db = SessionLocal()
    try:
        # Get profiles and permissions
        admin_profile = (
            db.query(Profile).filter(Profile.profile_name == "Administrator").first()
        )
        editor_profile = (
            db.query(Profile).filter(Profile.profile_name == "Editor").first()
        )
        viewer_profile = (
            db.query(Profile).filter(Profile.profile_name == "Viewer").first()
        )
        manager_profile = (
            db.query(Profile).filter(Profile.profile_name == "Manager").first()
        )

        all_permissions = db.query(Permission).all()
        permission_dict = {p.permission_name: p for p in all_permissions}

        # Administrator gets all permissions
        if admin_profile:
            for permission in all_permissions:
                existing = (
                    db.query(ProfilePermission)
                    .filter(
                        ProfilePermission.profile_id == admin_profile.id,
                        ProfilePermission.permission_id == permission.id,
                    )
                    .first()
                )

                if not existing:
                    profile_permission = ProfilePermission(
                        profile_id=admin_profile.id, permission_id=permission.id
                    )
                    db.add(profile_permission)

        # Editor gets create, edit, and view permissions
        if editor_profile:
            editor_perms = [
                "view_reports",
                "create_document",
                "edit_document",
                "view_users",
            ]
            for perm_name in editor_perms:
                if perm_name in permission_dict:
                    existing = (
                        db.query(ProfilePermission)
                        .filter(
                            ProfilePermission.profile_id == editor_profile.id,
                            ProfilePermission.permission_id
                            == permission_dict[perm_name].id,
                        )
                        .first()
                    )

                    if not existing:
                        profile_permission = ProfilePermission(
                            profile_id=editor_profile.id,
                            permission_id=permission_dict[perm_name].id,
                        )
                        db.add(profile_permission)

        # Viewer gets only view permissions
        if viewer_profile:
            viewer_perms = ["view_reports", "view_users"]
            for perm_name in viewer_perms:
                if perm_name in permission_dict:
                    existing = (
                        db.query(ProfilePermission)
                        .filter(
                            ProfilePermission.profile_id == viewer_profile.id,
                            ProfilePermission.permission_id
                            == permission_dict[perm_name].id,
                        )
                        .first()
                    )

                    if not existing:
                        profile_permission = ProfilePermission(
                            profile_id=viewer_profile.id,
                            permission_id=permission_dict[perm_name].id,
                        )
                        db.add(profile_permission)

        # Manager gets view and user management permissions
        if manager_profile:
            manager_perms = ["view_reports", "view_users", "edit_profile"]
            for perm_name in manager_perms:
                if perm_name in permission_dict:
                    existing = (
                        db.query(ProfilePermission)
                        .filter(
                            ProfilePermission.profile_id == manager_profile.id,
                            ProfilePermission.permission_id
                            == permission_dict[perm_name].id,
                        )
                        .first()
                    )

                    if not existing:
                        profile_permission = ProfilePermission(
                            profile_id=manager_profile.id,
                            permission_id=permission_dict[perm_name].id,
                        )
                        db.add(profile_permission)

        db.commit()
        print("Profile permissions assigned successfully")
    except Exception as e:
        db.rollback()
        print(f"Error seeding profile permissions: {e}")
    finally:
        db.close()


def seed_users():
    """Create initial test users"""
    db = SessionLocal()
    try:
        admin_profile = (
            db.query(Profile).filter(Profile.profile_name == "Administrator").first()
        )
        editor_profile = (
            db.query(Profile).filter(Profile.profile_name == "Editor").first()
        )
        viewer_profile = (
            db.query(Profile).filter(Profile.profile_name == "Viewer").first()
        )

        if not admin_profile or not editor_profile or not viewer_profile:
            print("Profiles not found. Please seed profiles first.")
            return

        users_data = [
            {
                "username": "admin",
                "email": "admin@example.com",
                "password": "admin123",
                "profile_id": admin_profile.id,
            },
            {
                "username": "editor",
                "email": "editor@example.com",
                "password": "editor123",
                "profile_id": editor_profile.id,
            },
            {
                "username": "viewer",
                "email": "viewer@example.com",
                "password": "viewer123",
                "profile_id": viewer_profile.id,
            },
        ]

        created_users = []
        for user_data in users_data:
            existing = db.query(User).filter(User.email == user_data["email"]).first()

            if not existing:
                password = user_data.pop("password")
                user = User(**user_data, password_hash=pwd_context.hash(password))
                db.add(user)
                created_users.append(user_data["username"])

        db.commit()
        if created_users:
            print(f"Created {len(created_users)} users: {', '.join(created_users)}")
            print("   Default password for all users: [username]123")
        else:
            print("Users already exist")
    except Exception as e:
        db.rollback()
        print(f"Error seeding users: {e}")
    finally:
        db.close()


def seed_customers():
    """Create sample customer data for testing reports"""
    db = SessionLocal()
    try:
        customers_data = [
            {
                "customer_name": "Acme Corporation",
                "contact_person": "John Doe",
                "email": "john.doe@acme.com",
                "phone": "+1-555-0100",
                "address": "123 Main St, New York, NY 10001",
            },
            {
                "customer_name": "TechStart Inc",
                "contact_person": "Jane Smith",
                "email": "jane.smith@techstart.com",
                "phone": "+1-555-0200",
                "address": "456 Innovation Drive, San Francisco, CA 94102",
            },
            {
                "customer_name": "Global Traders LLC",
                "contact_person": "Bob Johnson",
                "email": "bob.johnson@globaltraders.com",
                "phone": "+1-555-0300",
                "address": "789 Commerce Blvd, Chicago, IL 60601",
            },
        ]

        created_customers = []
        for customer_data in customers_data:
            existing = (
                db.query(Customer)
                .filter(Customer.email == customer_data["email"])
                .first()
            )

            if not existing:
                customer = Customer(**customer_data)
                db.add(customer)
                created_customers.append(customer_data["customer_name"])

        db.commit()
        if created_customers:
            print(f"Created {len(created_customers)} customers")
        else:
            print("Customers already exist")
    except Exception as e:
        db.rollback()
        print(f"Error seeding customers: {e}")
    finally:
        db.close()


def seed_orders():
    """Create sample orders for testing reports"""
    db = SessionLocal()
    try:
        customers = db.query(Customer).all()

        if not customers:
            print("No customers found. Please seed customers first.")
            return

        orders_data = [
            {
                "customer_id": customers[0].id,
                "order_date": date(2024, 1, 15),
                "total_amount": Decimal("1250.50"),
                "status": "completed",
                "delivery_date": date(2024, 1, 20),
                "delivery_address": customers[0].address,
            },
            {
                "customer_id": customers[0].id,
                "order_date": date(2024, 2, 10),
                "total_amount": Decimal("3500.00"),
                "status": "processing",
                "delivery_date": date(2024, 2, 25),
                "delivery_address": customers[0].address,
            },
            {
                "customer_id": customers[1].id,
                "order_date": date(2024, 1, 20),
                "total_amount": Decimal("850.75"),
                "status": "completed",
                "delivery_date": date(2024, 1, 28),
                "delivery_address": customers[1].address,
            },
            {
                "customer_id": customers[2].id,
                "order_date": date(2024, 2, 5),
                "total_amount": Decimal("5200.00"),
                "status": "pending",
                "delivery_date": None,
                "delivery_address": customers[2].address,
            },
        ]

        created_orders = 0
        for order_data in orders_data:
            # Check if similar order exists
            existing = (
                db.query(Order)
                .filter(
                    Order.customer_id == order_data["customer_id"],
                    Order.order_date == order_data["order_date"],
                    Order.total_amount == order_data["total_amount"],
                )
                .first()
            )

            if not existing:
                order = Order(**order_data)
                db.add(order)
                created_orders += 1

        db.commit()
        if created_orders:
            print(f"Created {created_orders} orders")
        else:
            print("Orders already exist")
    except Exception as e:
        db.rollback()
        print(f"Error seeding orders: {e}")
    finally:
        db.close()


def seed_all():
    """Run all seeding functions in the correct order"""
    print("\n🌱 Starting database seeding...\n")

    seed_permissions()
    seed_profiles()
    seed_profile_permissions()
    seed_users()
    seed_customers()
    seed_orders()

    print("\nDatabase seeding completed!\n")


if __name__ == "__main__":
    seed_all()
