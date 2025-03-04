package com.dotmarketing.portlets.osgi.AJAX;

import com.dotmarketing.business.APILocator;
import org.apache.commons.fileupload.FileItemFactory;
import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.io.IOUtils;
import com.dotmarketing.util.Logger;
import org.apache.commons.lang.BooleanUtils;
import org.apache.felix.framework.OSGIUtil;
import com.dotmarketing.util.SecurityLogger;
import com.liferay.util.FileUtil;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleException;

public class OSGIAJAX extends OSGIBaseAJAX {

    @Override
    public void action ( HttpServletRequest request, HttpServletResponse response ) throws ServletException, IOException {
    }

    public void undeploy ( HttpServletRequest request, HttpServletResponse response ) throws ServletException, IOException, InterruptedException {
        validateUser() ;
        
        String jarName = request.getParameter( "jar" );
        String bundleId = request.getParameter( "bundleId" );

        jarName = com.dotmarketing.util.FileUtil.sanitizeFileName(jarName);

        //First uninstall the bundle
        Bundle bundle;
        try {
            try {
                bundle = OSGIUtil.getInstance().getBundle(new Long(bundleId));
            } catch ( NumberFormatException e ) {
                bundle = OSGIUtil.getInstance().getBundle(bundleId);
            }

            bundle.uninstall();
          } catch ( BundleException e ) {
            Logger.error( OSGIAJAX.class, "Unable to undeploy bundle [" + e.getMessage() + "]", e );
        }

        //Then move the bundle from the load folder to the undeployed folder

        String loadPath = OSGIUtil.getInstance().getFelixDeployPath();
        String undeployedPath = OSGIUtil.getInstance().getFelixUndeployPath();

        File from = new File(loadPath + File.separator + jarName);
        File to = new File(undeployedPath + File.separator + jarName);

        if(to.getCanonicalPath().startsWith(undeployedPath) && to.exists()) {
            final boolean deleteOk = to.delete();
            Logger.info(OSGIAJAX.class,String.format(" File [%s] successfully un-deployed [%s].",to.getCanonicalPath(), BooleanUtils.toStringYesNo(deleteOk)) );
        }

        boolean success = FileUtil.move( from, to );
        if ( success ) {
        	Logger.info( OSGIAJAX.class, "OSGI Bundle "+jarName+ " Undeployed");
            remove();// removes portlets and actionlets references
            writeSuccess( response, "OSGI Bundle "+jarName+ " Undeployed" );
        } else {
            Logger.error( OSGIAJAX.class, "Error undeploying OSGI Bundle "+jarName );
            writeError( response, "Error undeploying OSGI Bundle "+jarName );
        }
    }

    public void deploy ( HttpServletRequest request, HttpServletResponse response ) throws ServletException, IOException {
        validateUser() ;
        
        String loadPath = OSGIUtil.getInstance().getFelixDeployPath();
        String undeployedPath = OSGIUtil.getInstance().getFelixUndeployPath();

        String jar = request.getParameter( "jar" );
        File from = new File(undeployedPath + File.separator + jar);
        File to = new File(loadPath + File.separator + jar);

        Boolean success = from.renameTo( to );
        if ( success ) {
        	Logger.info( OSGIAJAX.class, "OSGI Bundle "+jar+ " Loaded");
            writeSuccess( response, "OSGI Bundle  "+jar+ " Loaded" );
        } else {
            Logger.error( OSGIAJAX.class, "Error Loading OSGI Bundle " + jar );
            writeError( response, "Error Loading OSGI Bundle" + jar );
        }
    }

    public void stop ( HttpServletRequest request, HttpServletResponse response ) throws ServletException, IOException {
        validateUser() ;
        
        String bundleID = request.getParameter( "bundleId" );
        String jar = request.getParameter( "jar" );
        try {
            try {
                OSGIUtil.getInstance().getBundle(new Long(bundleID)).stop();
            } catch ( NumberFormatException e ) {
                OSGIUtil.getInstance().getBundle(bundleID).stop();
            }
            Logger.info( OSGIAJAX.class, "OSGI Bundle "+jar+ " Stopped");
            remove();// removes portlets and actionlets references
        } catch ( BundleException e ) {
            Logger.error( OSGIAJAX.class, e.getMessage(), e );
            throw new ServletException( e.getMessage() + " Unable to stop bundle", e );
        }
    }

    public void start ( HttpServletRequest request, HttpServletResponse response ) throws ServletException, IOException {
        validateUser() ;
        
        String bundleID = request.getParameter( "bundleId" );
        String jar = request.getParameter( "jar" );
        try {
            try {
                OSGIUtil.getInstance().getBundle(new Long(bundleID)).start();
            } catch ( NumberFormatException e ) {
                OSGIUtil.getInstance().getBundle(bundleID).start();
            }
            Logger.info( OSGIAJAX.class, "OSGI Bundle "+jar+ " Started");
        } catch ( BundleException e ) {
            Logger.error( OSGIAJAX.class, e.getMessage(), e );
            throw new ServletException( e.getMessage() + " Unable to start bundle", e );
        }
    }

    public void add ( HttpServletRequest request, HttpServletResponse response ) throws ServletException, IOException {
        validateUser() ;
        
        FileItemFactory factory = new DiskFileItemFactory();
        ServletFileUpload upload = new ServletFileUpload( factory );
        FileItemIterator iterator = null;
        String jar = request.getParameter( "jar" );
        try {
            iterator = upload.getItemIterator( request );
            while ( iterator.hasNext() ) {
                FileItemStream item = iterator.next();
                InputStream in = item.openStream();
                if ( item.getFieldName().equals( "bundleUpload" ) ) {
                    String fname = item.getName();
                    if ( !fname.endsWith( ".jar" ) ) {
                        Logger.warn( this, "Cannot deploy bundle as it is not a JAR" );
                        writeError( response, "Cannot deploy bundle as it is not a JAR" );
                        break;
                    }

                    String felixDeployFolder = OSGIUtil.getInstance().getFelixUploadPath();

                    File felixFolder = new File(felixDeployFolder);
                    File osgiJar = new File(felixDeployFolder + File.separator + fname);

                    if ( !felixFolder.exists() 
                            ||   !osgiJar.getCanonicalPath().startsWith(felixFolder.getCanonicalPath())) {
                        response.sendError(403);
                        SecurityLogger.logInfo(this.getClass(),  "Invalid OSGI Upload request:" + osgiJar.getCanonicalPath() + " from:" +request.getRemoteHost() + " " );
                        return;
                    }

                    final OutputStream out = Files.newOutputStream(osgiJar.toPath());
                    IOUtils.copyLarge( in, out );
                    IOUtils.closeQuietly( out );
                    IOUtils.closeQuietly( in );
                }
            }
            OSGIUtil.getInstance().checkUploadFolder();
            
            
          Logger.info( OSGIAJAX.class, "OSGI Bundle "+jar+ " Uploaded");
        } catch ( FileUploadException e ) {
            Logger.error( OSGIBaseAJAX.class, e.getMessage(), e );
            throw new IOException( e.getMessage(), e );
        }
    }

    /**
     * Returns the packages inside the <strong>osgi-extra.conf</strong> file, those packages are the value
     * for the OSGI configuration property <strong>org.osgi.framework.system.packages.extra</strong>.
     *
     * @param request
     * @param response
     * @throws ServletException
     * @throws IOException
     */
    public void getExtraPackages ( HttpServletRequest request, HttpServletResponse response ) throws ServletException, IOException {
        validateUser() ;
        
        //Read the list of the dotCMS exposed packages to the OSGI context
        String extraPackages = OSGIUtil.getInstance().getExtraOSGIPackages();

        //Send a respose
        writeSuccess( response, extraPackages );
    }

    /**
     * Overrides the content of the <strong>osgi-extra.conf</strong> file
     *
     * @param request
     * @param response
     * @throws ServletException
     * @throws IOException
     */
    public void modifyExtraPackages ( HttpServletRequest request, HttpServletResponse response ) throws ServletException, IOException {
        validateUser() ;
        
        //Get the packages from the form
        String extraPackages = request.getParameter( "packages" );


        OSGIUtil.getInstance().writeOsgiExtras(extraPackages);

        
        writeSuccess( response, "OSGI Extra Packages Saved" );
    }

    public void restart ( HttpServletRequest request, HttpServletResponse response ) throws ServletException, IOException {
        validateUser() ;
        
        // restart the framework at notify to all nodes to do the same
        OSGIUtil.getInstance().restartOsgiClusterWide();
        //Send a respose
        writeSuccess( response, "OSGI Framework Restarted" );
    }

    private void remove () {
        validateUser() ;
        
        //Remove Portlets in the list
        OSGIUtil.getInstance().portletIDsStopped.stream().forEach(p -> {APILocator.getPortletAPI().deletePortlet(p);});
        Logger.info( this, "Portlets Removed: " + OSGIUtil.getInstance().portletIDsStopped.toString() );

        //Remove Actionlets in the list
        OSGIUtil.getInstance().actionletsStopped.stream().forEach(p -> {OSGIUtil.getInstance().workflowOsgiService.removeActionlet(p);});
        Logger.info( this, "Actionlets Removed: " + OSGIUtil.getInstance().actionletsStopped.toString());

        //Cleanup lists
        OSGIUtil.getInstance().portletIDsStopped.clear();
        OSGIUtil.getInstance().actionletsStopped.clear();

    }

}
