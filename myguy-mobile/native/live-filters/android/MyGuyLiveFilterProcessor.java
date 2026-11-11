package org.webrtc;

import android.graphics.Matrix;
import android.opengl.GLES11Ext;
import android.opengl.GLES20;
import android.os.Handler;
import android.util.Log;
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor;
import java.nio.FloatBuffer;
import java.util.ArrayList;
import java.util.List;

public final class MyGuyLiveFilterProcessor implements VideoFrameProcessor {
  private static final String TAG = "MyGuyLiveFilter";
  private static final int MAX_OUTPUT_BUFFERS = 3;
  private static final float[] VERTICES = {
    -1f, -1f, 1f, -1f, -1f, 1f, 1f, 1f
  };
  private static final float[] TEX_COORDS = {
    0f, 0f, 1f, 0f, 0f, 1f, 1f, 1f
  };
  private static final String VERTEX_SHADER =
      "attribute vec4 in_pos;\n"
          + "attribute vec4 in_tc;\n"
          + "uniform mat4 texMatrix;\n"
          + "varying vec2 uv;\n"
          + "void main() { gl_Position = in_pos; uv = (texMatrix * in_tc).xy; }\n";
  private static final String FRAGMENT_SHADER =
      "#extension GL_OES_EGL_image_external : require\n"
          + "precision mediump float;\n"
          + "varying vec2 uv;\n"
          + "uniform samplerExternalOES inputImage;\n"
          + "uniform int look;\n"
          + "void main() {\n"
          + "  vec4 c = texture2D(inputImage, uv);\n"
          + "  if (look == 0) c.rgb = vec3(c.r * 1.08 + 0.025, c.g * 1.015, c.b * 0.91);\n"
          + "  else if (look == 1) { float y = dot(c.rgb, vec3(0.299, 0.587, 0.114)); "
          + "c.rgb = mix(vec3(y), c.rgb, 0.82) * 1.04 + 0.015; }\n"
          + "  else { float y = dot(c.rgb, vec3(0.299, 0.587, 0.114)); "
          + "c.rgb = vec3(y * 1.06 + 0.015); }\n"
          + "  gl_FragColor = vec4(clamp(c.rgb, 0.0, 1.0), c.a);\n"
          + "}\n";

  private final String preset;
  private final List<OutputBuffer> outputBuffers = new ArrayList<>();
  private final FloatBuffer vertexBuffer = GlUtil.createFloatBuffer(VERTICES);
  private final FloatBuffer textureBuffer = GlUtil.createFloatBuffer(TEX_COORDS);
  private GlShader shader;
  private volatile Handler handler;
  private int inputTextureLocation;
  private int lookLocation;
  private int texMatrixLocation;
  private int positionLocation;
  private int texCoordLocation;
  private volatile boolean stopped;

  public MyGuyLiveFilterProcessor(String preset) {
    this.preset = preset;
  }

  @Override
  public VideoFrame process(VideoFrame frame, SurfaceTextureHelper textureHelper) {
    handler = textureHelper.getHandler();
    if (!(frame.getBuffer() instanceof VideoFrame.TextureBuffer)) {
      return null;
    }
    VideoFrame.TextureBuffer input = (VideoFrame.TextureBuffer) frame.getBuffer();
    if (input.getType() != VideoFrame.TextureBuffer.Type.OES) {
      return null;
    }

    OutputBuffer output = acquireOutputBuffer(input.getWidth(), input.getHeight());
    if (output == null) {
      return null;
    }

    try {
      if (shader == null) {
        shader = new GlShader(VERTEX_SHADER, FRAGMENT_SHADER);
        inputTextureLocation = shader.getUniformLocation("inputImage");
        lookLocation = shader.getUniformLocation("look");
        texMatrixLocation = shader.getUniformLocation("texMatrix");
        positionLocation = shader.getAttribLocation("in_pos");
        texCoordLocation = shader.getAttribLocation("in_tc");
      }
      draw(input, output);
      output.inUse = true;
      final OutputBuffer returnedBuffer = output;
      Matrix identity = new Matrix();
      VideoFrame.TextureBuffer textureBuffer = new TextureBufferImpl(
          output.width,
          output.height,
          VideoFrame.TextureBuffer.Type.RGB,
          output.frameBuffer.getTextureId(),
          identity,
          textureHelper,
          () -> textureHelper.getHandler().post(() -> releaseOutputBuffer(returnedBuffer)));
      return new VideoFrame(textureBuffer, frame.getRotation(), frame.getTimestampNs());
    } catch (RuntimeException error) {
      releaseOutputBuffer(output);
      Log.e(TAG, "Filter frame processing failed; forwarding the camera frame without a filter.", error);
      return null;
    }
  }

  @Override
  public void onCapturerStarted() {
    stopped = false;
  }

  @Override
  public void onCapturerStopped() {
    stopped = true;
    if (handler != null) {
      handler.post(this::releaseUnusedBuffers);
    }
  }

  private void draw(VideoFrame.TextureBuffer input, OutputBuffer output) {
    GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, output.frameBuffer.getFrameBufferId());
    GLES20.glViewport(0, 0, output.width, output.height);
    GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
    shader.useProgram();
    shader.setVertexAttribArray("in_pos", 2, vertexBuffer);
    shader.setVertexAttribArray("in_tc", 2, textureBuffer);
    GLES20.glUniformMatrix4fv(
        texMatrixLocation, 1, false, convertTransformMatrix(input.getTransformMatrix()), 0);
    GLES20.glUniform1i(inputTextureLocation, 0);
    GLES20.glUniform1i(lookLocation, "warm".equals(preset) ? 0 : "soft".equals(preset) ? 1 : 2);
    GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
    GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, input.getTextureId());
    GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
    GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, 0);
    GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, 0);
    GLES20.glDisableVertexAttribArray(positionLocation);
    GLES20.glDisableVertexAttribArray(texCoordLocation);
    GLES20.glUseProgram(0);
    GlUtil.checkNoGLES2Error("MyGuy live filter");
  }

  private synchronized OutputBuffer acquireOutputBuffer(int width, int height) {
    if (stopped) {
      return null;
    }
    for (OutputBuffer buffer : outputBuffers) {
      if (!buffer.inUse && buffer.width == width && buffer.height == height) {
        return buffer;
      }
    }
    if (!outputBuffers.isEmpty()) {
      for (OutputBuffer buffer : outputBuffers) {
        if (buffer.inUse) {
          return null;
        }
      }
      for (OutputBuffer buffer : outputBuffers) {
        buffer.frameBuffer.release();
      }
      outputBuffers.clear();
    }
    if (outputBuffers.size() >= MAX_OUTPUT_BUFFERS) {
      return null;
    }
    OutputBuffer buffer = new OutputBuffer(width, height);
    outputBuffers.add(buffer);
    return buffer;
  }

  private synchronized void releaseOutputBuffer(OutputBuffer buffer) {
    buffer.inUse = false;
    if (stopped) {
      buffer.frameBuffer.release();
      outputBuffers.remove(buffer);
    }
  }

  private synchronized void releaseUnusedBuffers() {
    for (int index = outputBuffers.size() - 1; index >= 0; index--) {
      OutputBuffer buffer = outputBuffers.get(index);
      if (!buffer.inUse) {
        buffer.frameBuffer.release();
        outputBuffers.remove(index);
      }
    }
    if (shader != null) {
      shader.release();
      shader = null;
    }
  }

  private static float[] convertTransformMatrix(Matrix matrix) {
    float[] values = new float[9];
    matrix.getValues(values);
    return new float[] {
      values[0], values[3], 0f, values[6],
      values[1], values[4], 0f, values[7],
      0f, 0f, 1f, 0f,
      values[2], values[5], 0f, values[8]
    };
  }

  private static final class OutputBuffer {
    final int width;
    final int height;
    final GlTextureFrameBuffer frameBuffer;
    boolean inUse;

    OutputBuffer(int width, int height) {
      this.width = width;
      this.height = height;
      this.frameBuffer = new GlTextureFrameBuffer(GLES20.GL_RGBA);
      this.frameBuffer.setSize(width, height);
    }
  }
}
