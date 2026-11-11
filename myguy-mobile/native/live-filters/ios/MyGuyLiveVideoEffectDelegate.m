#import "MyGuyLiveVideoEffectDelegate.h"

#import <CoreImage/CoreImage.h>
#import <WebRTC/RTCCVPixelBuffer.h>
#import <WebRTC/RTCVideoFrame.h>

#import <React/RCTLog.h>

@interface MyGuyLiveVideoEffectDelegate ()

@property(nonatomic, weak) id<RTCVideoCapturerDelegate> sink;
@property(atomic, copy) NSString *activeEffectName;
@property(nonatomic, strong) CIContext *context;
@property(nonatomic, assign) CVPixelBufferPoolRef pixelBufferPool;
@property(nonatomic, assign) size_t poolWidth;
@property(nonatomic, assign) size_t poolHeight;
@property(nonatomic, assign) BOOL warnedAboutFrameFormat;
@property(nonatomic, assign) BOOL warnedAboutBufferAllocation;

@end

@implementation MyGuyLiveVideoEffectDelegate

- (instancetype)initWithSink:(id<RTCVideoCapturerDelegate>)sink {
    self = [super init];
    if (self) {
        _sink = sink;
        _context = [CIContext contextWithOptions:@{kCIContextUseSoftwareRenderer : @NO}];
        _activeEffectName = @"none";
    }
    return self;
}

- (void)dealloc {
    if (_pixelBufferPool) {
        CVPixelBufferPoolRelease(_pixelBufferPool);
    }
}

- (void)setEffectName:(NSString *)name {
    NSString *effect = name ?: @"none";
    NSSet *supportedEffects = [NSSet setWithArray:@[@"none", @"warm", @"soft", @"mono"]];
    if (![supportedEffects containsObject:effect]) {
        RCTLogWarn(@"[MyGuyLiveFilter] Ignoring unsupported filter %@", effect);
        return;
    }
    self.activeEffectName = effect;
}

- (void)capturer:(RTCVideoCapturer *)capturer didCaptureVideoFrame:(RTCVideoFrame *)frame {
    @autoreleasepool {
        RTCVideoFrame *outputFrame = frame;
        NSString *effectName = self.activeEffectName;
        if (![effectName isEqualToString:@"none"]) {
            outputFrame = [self filteredFrame:frame effectName:effectName] ?: frame;
        }
        [self.sink capturer:capturer didCaptureVideoFrame:outputFrame];
    }
}

- (RTCVideoFrame *)filteredFrame:(RTCVideoFrame *)frame effectName:(NSString *)effectName {
    if (!self.context) {
        RCTLogError(@"[MyGuyLiveFilter] Core Image is unavailable; publishing unfiltered video.");
        return nil;
    }

    if (![frame.buffer isKindOfClass:[RTCCVPixelBuffer class]]) {
        if (!self.warnedAboutFrameFormat) {
            RCTLogWarn(@"[MyGuyLiveFilter] Camera frame format is unsupported; publishing unfiltered video.");
            self.warnedAboutFrameFormat = YES;
        }
        return nil;
    }

    CVPixelBufferRef inputBuffer = ((RTCCVPixelBuffer *)frame.buffer).pixelBuffer;
    size_t width = CVPixelBufferGetWidth(inputBuffer);
    size_t height = CVPixelBufferGetHeight(inputBuffer);
    CVPixelBufferRef outputBuffer = [self newPixelBufferWithWidth:width height:height];
    if (!outputBuffer) {
        return nil;
    }

    CIImage *image = [CIImage imageWithCVPixelBuffer:inputBuffer];
    CIImage *filteredImage = [self applyEffectToImage:image effectName:effectName];
    CGRect bounds = CGRectMake(0, 0, width, height);
    [self.context render:filteredImage
         toCVPixelBuffer:outputBuffer
                  bounds:bounds
              colorSpace:nil];

    RTCCVPixelBuffer *buffer = [[RTCCVPixelBuffer alloc] initWithPixelBuffer:outputBuffer];
    RTCVideoFrame *filteredFrame =
        [[RTCVideoFrame alloc] initWithBuffer:buffer rotation:frame.rotation timeStampNs:frame.timeStampNs];
    CVPixelBufferRelease(outputBuffer);
    return filteredFrame;
}

- (CIImage *)applyEffectToImage:(CIImage *)image effectName:(NSString *)effectName {
    if ([effectName isEqualToString:@"warm"]) {
        CIFilter *filter = [CIFilter filterWithName:@"CIColorMatrix"];
        [filter setValue:image forKey:kCIInputImageKey];
        [filter setValue:[CIVector vectorWithX:1.08 Y:0 Z:0 W:0] forKey:@"inputRVector"];
        [filter setValue:[CIVector vectorWithX:0 Y:1.015 Z:0 W:0] forKey:@"inputGVector"];
        [filter setValue:[CIVector vectorWithX:0 Y:0 Z:0.91 W:0] forKey:@"inputBVector"];
        [filter setValue:[CIVector vectorWithX:0.025 Y:0 Z:0 W:0] forKey:@"inputBiasVector"];
        return filter.outputImage ?: image;
    }

    CIFilter *filter = [CIFilter filterWithName:@"CIColorControls"];
    [filter setValue:image forKey:kCIInputImageKey];
    [filter setValue:@([effectName isEqualToString:@"mono"] ? 0 : 0.82)
              forKey:kCIInputSaturationKey];
    [filter setValue:@([effectName isEqualToString:@"mono"] ? 1.06 : 1.04)
              forKey:kCIInputContrastKey];
    [filter setValue:@(0.015) forKey:kCIInputBrightnessKey];
    return filter.outputImage ?: image;
}

- (CVPixelBufferRef)newPixelBufferWithWidth:(size_t)width height:(size_t)height {
    if (!self.pixelBufferPool || width != self.poolWidth || height != self.poolHeight) {
        if (self.pixelBufferPool) {
            CVPixelBufferPoolRelease(self.pixelBufferPool);
            self.pixelBufferPool = NULL;
        }
        NSDictionary *attributes = @{
            (NSString *)kCVPixelBufferPixelFormatTypeKey : @(kCVPixelFormatType_420YpCbCr8BiPlanarFullRange),
            (NSString *)kCVPixelBufferWidthKey : @(width),
            (NSString *)kCVPixelBufferHeightKey : @(height),
            (NSString *)kCVPixelBufferIOSurfacePropertiesKey : @{},
        };
        CVReturn poolResult = CVPixelBufferPoolCreate(
            kCFAllocatorDefault, NULL, (__bridge CFDictionaryRef)attributes, &_pixelBufferPool);
        if (poolResult != kCVReturnSuccess || !_pixelBufferPool) {
            RCTLogWarn(@"[MyGuyLiveFilter] Could not create a camera frame buffer pool (%d).", poolResult);
            return NULL;
        }
        self.poolWidth = width;
        self.poolHeight = height;
    }

    CVPixelBufferRef outputBuffer = NULL;
    NSDictionary *auxiliaryAttributes = @{
        (NSString *)kCVPixelBufferPoolAllocationThresholdKey : @3,
    };
    CVReturn bufferResult = CVPixelBufferPoolCreatePixelBufferWithAuxAttributes(
        kCFAllocatorDefault, self.pixelBufferPool, (__bridge CFDictionaryRef)auxiliaryAttributes, &outputBuffer);
    if (bufferResult != kCVReturnSuccess) {
        if (!self.warnedAboutBufferAllocation) {
            RCTLogWarn(@"[MyGuyLiveFilter] Could not allocate a filter buffer (%d); publishing unfiltered frames.", bufferResult);
            self.warnedAboutBufferAllocation = YES;
        }
        return NULL;
    }
    self.warnedAboutBufferAllocation = NO;
    return outputBuffer;
}

@end
