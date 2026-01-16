import logging
import os
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

try:
    import boto3
    from botocore.exceptions import NoCredentialsError
except ImportError:
    boto3 = None
    NoCredentialsError = None

logger = logging.getLogger("speech_coach.storage")


class StorageProvider(ABC):
    @abstractmethod
    def save_file(self, data: bytes, filename: str) -> str:
        """Saves bytes to storage and returns a relative URL or path."""
        pass

    @abstractmethod
    def get_url(self, filename: str) -> str:
        """Returns the access URL for a given filename."""
        pass

    @abstractmethod
    def delete_file(self, filename: str) -> None:
        """Deletes a file from storage."""
        pass


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: Path, base_url: str = "/output"):
        self.base_dir = base_dir
        self.base_url = base_url
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, data: bytes, filename: str) -> str:
        file_path = self.base_dir / filename
        with open(file_path, "wb") as f:
            f.write(data)
        logger.info(f"Saved local file: {file_path}")
        return f"{self.base_url}/{filename}"

    def get_url(self, filename: str) -> str:
        return f"{self.base_url}/{filename}"

    def delete_file(self, filename: str) -> None:
        file_path = self.base_dir / filename
        if file_path.exists():
            try:
                os.remove(file_path)
                logger.info(f"Deleted local file: {file_path}")
            except OSError as e:
                logger.error(f"Error deleting file {file_path}: {e}")
        else:
            logger.warning(f"File not found for deletion: {file_path}")


class S3StorageProvider(StorageProvider):
    def __init__(self, bucket_name: str, region_name: str, aws_access_key_id: str, aws_secret_access_key: str):
        self.bucket_name = bucket_name
        self.region_name = region_name
        self.s3_client = boto3.client(
            "s3",
            region_name=region_name,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
        )

    def save_file(self, data: bytes, filename: str) -> str:
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=filename,
                Body=data,
                ContentType="audio/wav"  # Assuming wav for now, could be dynamic
            )
            logger.info(f"Uploaded to S3: {filename}")
            return self.get_url(filename)
        except NoCredentialsError:
            logger.error("AWS credentials not available")
            raise Exception("AWS credentials not available")
        except Exception as e:
            logger.error(f"S3 Upload Error: {e}")
            raise

    def get_url(self, filename: str) -> str:
        # Constructing a standard public URL, or presigned if needed. 
        # For simplicity in this demo, standard URL.
        return f"https://{self.bucket_name}.s3.{self.region_name}.amazonaws.com/{filename}"

    def delete_file(self, filename: str) -> None:
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=filename)
            logger.info(f"Deleted from S3: {filename}")
        except Exception as e:
            logger.error(f"S3 Delete Error: {e}")


def get_storage_provider(config: dict, output_dir: Path) -> StorageProvider:
    """Factory to get the configured storage provider."""
    storage_type = config.get("STORAGE_TYPE", "local").lower()
    
    if storage_type == "s3":
        return S3StorageProvider(
            bucket_name=config.get("S3_BUCKET_NAME"),
            region_name=config.get("S3_REGION"),
            aws_access_key_id=config.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=config.get("AWS_SECRET_ACCESS_KEY"),
        )
    else:
        return LocalStorageProvider(base_dir=output_dir)
