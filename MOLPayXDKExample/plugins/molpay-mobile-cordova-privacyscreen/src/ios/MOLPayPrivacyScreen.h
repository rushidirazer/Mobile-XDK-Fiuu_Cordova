#import <Cordova/CDV.h>
#import <Cordova/CDVPlugin.h>

typedef struct {
  BOOL iPhone;
  BOOL iPad;
  BOOL iPhone4;
  BOOL iPhone5;
  BOOL iPhone6;
  BOOL iPhone6Plus;
  BOOL retina;
  
} CDV_iOSDevice;

@interface MOLPayPrivacyScreen : CDVPlugin

- (void) enable:(CDVInvokedUrlCommand*)command;
    
- (void) disable:(CDVInvokedUrlCommand*)command;
    
@end
