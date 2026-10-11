# Shipped to every app that depends on this module.
#
# IdentityVerification 1.3.5 references kotlinx.parcelize.Parcelize but its own consumer
# rules do not suppress the missing class, so an app that minifies with R8 and does not use
# the kotlin-parcelize plugin fails its release build with "Missing class
# kotlinx.parcelize.Parcelize". The annotation is not needed at runtime, so suppressing the
# warning is safe. Remove once the native SDK ships this rule itself.
-dontwarn kotlinx.parcelize.Parcelize
