#import <WebRTC/RTCVideoCapturer.h>

@interface MyGuyLiveVideoEffectDelegate : NSObject <RTCVideoCapturerDelegate>

- (instancetype)initWithSink:(id<RTCVideoCapturerDelegate>)sink;
- (void)setEffectName:(NSString *)name;

@end
